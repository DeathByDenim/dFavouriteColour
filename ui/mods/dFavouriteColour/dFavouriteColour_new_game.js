(function() {

initialSettingValue('dFavouriteColour_primary', 'RANDOM');
//initialSettingValue('dFavouriteColour_secondary', 'RANDOM');
initialSettingValue('dFavouriteColour_primary_alternative', 'RANDOM');
//initialSettingValue('dFavouriteColour_secondary_alternative', 'RANDOM');

var settings = decode(localStorage.settings);
var myprimarycolour = undefined;
var myaltprimarycolour = undefined;
var infinite_loop_prevent_counter = 0;

if(settings['dFavouriteColour_primary'] !== 'RANDOM')
	myprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary']].colour;
if(settings['dFavouriteColour_primary_alternative'] !== 'RANDOM')
	myaltprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary_alternative']].colour;

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

var oldhandlerplayers = handlers.players;
handlers.players = function (payload, force) {
	oldhandlerplayers(payload, force);

	// Shouldn't happen, but you never know.
	if(infinite_loop_prevent_counter > 50)
		return;

	// Bah, the user didn't even select a favourite colour.
	if(myprimarycolour === undefined)
		return;

	var wantedcolour = myprimarycolour;
	if(colourIsTaken(myprimarycolour))
	{
		if(myaltprimarycolour === undefined)
			return;

		// It appears some fiend already took you colour! Try the alternative.
		wantedcolour = myaltprimarycolour;
		if(colourIsTaken(myaltprimarycolour))
			return;
	}

	for(var i = 0; i < payload.length; i++)
	{
		if(payload[i].name == model.displayName())
		{
			var rgbcolour = "rgb("+payload[i].color[0][0]+","+payload[i].color[0][1]+","+payload[i].color[0][2]+")";
			if(wantedcolour !== rgbcolour)
			{
				model.send_message('next_primary_color');
				infinite_loop_prevent_counter++;
			}
			break;
		}
	}
}


})();
