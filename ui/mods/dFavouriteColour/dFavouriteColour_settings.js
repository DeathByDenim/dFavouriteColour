initialSettingValue('dFavouriteColour_primary', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary', 'RANDOM');

model.addSetting_DropDown('PRIMARY', 'dFavouriteColour_primary', 'UI', ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'], 0, 'Favourite Colour');
model.addSetting_DropDown('SECONDARY', 'dFavouriteColour_secondary', 'UI', ['RANDOM'], 0, 'Favourite Colour');

model.dFavouriteColour_secondary_options = ko.computed(function() {
	if(model.dFavouriteColour_primary() == 'RANDOM')
		return ['RANDOM'];

	var colours = dFavouriteColour_colourtable[model.dFavouriteColour_primary()].secondary_colour.slice();
	colours.unshift('RANDOM');

	return colours;
});
