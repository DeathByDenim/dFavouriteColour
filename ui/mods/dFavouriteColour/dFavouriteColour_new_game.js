(function() {

initialSettingValue('dFavouriteColour_primary', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary', 'RANDOM');
initialSettingValue('dFavouriteColour_primary_alternative', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary_alternative', 'RANDOM');

var settings = decode(localStorage.settings);
var myprimarycolour = undefined;
var mysecondarycolour = undefined;
var myaltprimarycolour = undefined;
var myaltsecondarycolour = undefined;
var infinite_loop_prevent_counter = 0;

if(settings['dFavouriteColour_primary'] !== 'RANDOM')
	myprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary']].colour;
if(settings['dFavouriteColour_secondary'] !== 'RANDOM')
	mysecondarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_secondary']].colour;
if(settings['dFavouriteColour_primary_alternative'] !== 'RANDOM')
	myaltprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary_alternative']].colour;
if(settings['dFavouriteColour_secondary_alternative'] !== 'RANDOM')
	myaltsecondarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_secondary_alternative']].colour;

var colourselectionenabled = true;

function colourIsTaken(colour)
{
	var armies = model.armies();
	for(var a = 0; a < armies.length; a++)
	{
		var slots = armies[a].slots();
		for(var s = 0; s < slots.length; s++)
		{
			if(slots[s].primaryColor() === colour)
			{
				// If the colour is taken by myself then it doesn't count
				if(slots[s].playerName() === model.displayName())
					return false;
				else
					return true;
			}
		}
	}

	return false;
}

var prev_primary_colour = undefined;
var prev_secondary_colour = undefined;
var oldhandlerplayers = handlers.players;
handlers.players = function (payload, force) {
	oldhandlerplayers(payload, force);

	if(!colourselectionenabled)
		return;

	// Shouldn't happen, but you never know.
	if(infinite_loop_prevent_counter > 50)
		return;

	// Bah, the user didn't even select a favourite colour.
	if(myprimarycolour === undefined)
		return;

	var wantedprimarycolour = myprimarycolour;
	var wantedsecondarycolour = mysecondarycolour;
	if(colourIsTaken(myprimarycolour))
	{
		if(myaltprimarycolour === undefined)
			return;

		// It appears some fiend already took my colour! Try the alternative.
		wantedprimarycolour = myaltprimarycolour;
		wantedsecondarycolour = myaltsecondarycolour;
		if(colourIsTaken(myaltprimarycolour))
			return;
	}

	for(var i = 0; i < payload.length; i++)
	{
		if(payload[i].name == model.displayName())
		{
			var rgb_primary_colour = "rgb("+payload[i].color[0][0]+","+payload[i].color[0][1]+","+payload[i].color[0][2]+")";
			var rgb_secondary_colour = "rgb("+payload[i].color[1][0]+","+payload[i].color[1][1]+","+payload[i].color[1][2]+")";

			// Nothing changed. So don't do anything.
			if(prev_primary_colour === rgb_primary_colour && prev_secondary_colour === rgb_secondary_colour)
			{
				console.log("dFav: Did something!");
				break;
			}

			prev_primary_colour = rgb_primary_colour;
			prev_secondary_colour = rgb_secondary_colour;

			if(wantedprimarycolour !== rgb_primary_colour)
			{
				model.send_message('next_primary_color');
				infinite_loop_prevent_counter++;
			}
			else if(wantedsecondarycolour !== undefined && wantedsecondarycolour !== rgb_secondary_colour)
			{
				model.send_message('next_secondary_color');
				infinite_loop_prevent_counter++;
			}

			break;
		}
	}
}

var oldhandlerarmies = handlers.armies;
handlers.armies= function (payload, force) {
	oldhandlerarmies(payload, force);

	if(!colourselectionenabled)
		return;

	// Modify the nextPrimaryColor and nextSecondaryColor function of the army to prevent this mod from interfering with manual colour selection.
	_.forEach(model.armies(), function (element) {
		element.nextPrimaryColor = function () {
			colourselectionenabled = false;
			model.send_message('next_primary_color');
		};
		element.nextSecondaryColor = function () {
			colourselectionenabled = false;
			model.send_message('next_secondary_color');
		};
	});
}

})();
