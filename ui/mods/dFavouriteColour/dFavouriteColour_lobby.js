(function() {

initialSettingValue('dFavouriteColour_primary', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary', 'RANDOM');
initialSettingValue('dFavouriteColour_primary_alternative', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary_alternative', 'RANDOM');

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
	function colourAlreadyInUse(armies, colour) {
		for(var i = 0; i < armies.length; ++i) {
			if(i != my_army_index && armies[i].primary_color == colour) {
				return true;
			}
		}
		return false;
	}

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

		if(my_army_index < 0)
			return;

		if(!colourchoosingenabled || infinitelooppreventcounter > 30)
			return;

		// No point in trying to select the colour if it's already in use.
		if(colourAlreadyInUse(armies, myprimarycolour)) {
			if(settings['dFavouriteColour_primary_alternative'] == 'RANDOM') {
				return;
			}
			else {
				myprimarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_primary_alternative']].colour;
				mysecondarycolour = dFavouriteColour_colourtable[settings['dFavouriteColour_secondary_alternative']].colour;

				if(colourAlreadyInUse(armies, myprimarycolour)) {
					return;
				}
			}
		}

		// army_state is sometimes called twice. So check if one of the colours actually changed
		if(my_army_index >= 0 && (armies[my_army_index].primary_color != previousprimarycolour || armies[my_army_index].secondary_color != previoussecondarycolour)) {
			previousprimarycolour = armies[my_army_index].primary_color;
			previoussecondarycolour = armies[my_army_index].secondary_color;

			// Set the first colour by sending "next_primary_color" to the server until the desired colour has been obtained.
			if(armies[my_army_index].primary_color != myprimarycolour) {
				model.send_message('next_primary_color');
			}
			// Set the second colour by sending "next_secondary_color" to the server until the desired colour has been obtained.
			else if(mysecondarycolour && armies[my_army_index].secondary_color != mysecondarycolour) {
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
