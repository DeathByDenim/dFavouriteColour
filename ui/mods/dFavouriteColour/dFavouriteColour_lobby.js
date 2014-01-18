(function() {

initialSettingValue('dFavouriteColour_primary', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary', 'RANDOM');

var settings = decode(localStorage.settings);
var myprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary']].colour;
var mysecondarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_secondary']].colour;

var my_army_index = -1;
var my_slot_index = -1;

var previousprimarycolour = "";
var previoussecondarycolour = "";
var colourchoosingenabled = true;

var infinitelooppreventcounter = 0;

if(myprimarycolour)
{
	var oldjoin = model.join;
	model.join = function (army_index, slot_index) {
		oldjoin(army_index, slot_index);

		my_army_index = army_index;
		my_slot_index = slot_index;

		infinitelooppreventcounter = 0;
	}

	var oldarmy_state = handlers.army_state;
	handlers.army_state = function (armies) {
		oldarmy_state(armies);

		if(!colourchoosingenabled || infinitelooppreventcounter > 24)
			return;

		// No point in trying to select the colour if it's already in use.
		var colour_already_in_use = false;
		for(var i = 0; i < armies.length; ++i) {
			if(armies[i].primary_color == myprimarycolour) {
				colour_already_in_use = true;
				break;
			}
		}

		if(colour_already_in_use)
			return;

		// army_state is sometimes called twice. So check if one of the colours actually changed
		if(my_army_index >= 0 && armies[my_army_index].primary_color != previousprimarycolour && armies[my_army_index].secondary_color != previoussecondarycolour) {
			// Set the first colour by sending "next_primary_color" to the server until the desired colour has been obtained.
			if(armies[my_army_index].primary_color != myprimarycolour) {
				previousprimarycolour = armies[my_army_index].primary_color;
				model.send_message('next_primary_color');
			}
			// Set the second colour by sending "next_secondary_color" to the server until the desired colour has been obtained.
			else if(mysecondarycolour && armies[my_army_index].secondary_color != mysecondarycolour) {
				previousprimarycolour = armies[my_army_index].secondary_color;
				model.send_message('next_secondary_color');
			}

			infinitelooppreventcounter++;
		}
	}

	// Disable the automatic colour choosing if the player him/herself changes the colour manually.
	var oldnextPrimaryColor = model.nextPrimaryColor;
	model.nextPrimaryColor = function (army_index) {
		colourchoosingenabled = false;
		oldnextPrimaryColor(army_index);
	}

	var oldnextSecondaryColor = model.nextSecondaryColor;
	model.nextSecondaryColor = function (army_index) {
		colourchoosingenabled = false;
		oldnextSecondaryColor(army_index);
	}
}

})();
