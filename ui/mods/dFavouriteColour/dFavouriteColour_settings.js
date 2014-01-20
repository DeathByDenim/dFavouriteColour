initialSettingValue('dFavouriteColour_primary', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary', 'RANDOM');
initialSettingValue('dFavouriteColour_primary_alternative', 'RANDOM');
initialSettingValue('dFavouriteColour_secondary_alternative', 'RANDOM');

model.addSetting_DropDown('PRIMARY', 'dFavouriteColour_primary', 'UI', ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'], 0, 'Favourite Colour');
model.addSetting_DropDown('SECONDARY', 'dFavouriteColour_secondary', 'UI', ['RANDOM'], 0, 'Favourite Colour');
model.addSetting_DropDown('ALT PRIMARY', 'dFavouriteColour_primary_alternative', 'UI', ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'], 0, 'Favourite Colour');
model.addSetting_DropDown('ALT SECONDARY', 'dFavouriteColour_secondary_alternative', 'UI', ['RANDOM'], 0, 'Favourite Colour');

model.dFavouriteColour_secondary_options = ko.computed(function() {
	if(model.dFavouriteColour_primary() == 'RANDOM')
		return ['RANDOM'];

	var colours = dFavouriteColour_colourtable[model.dFavouriteColour_primary()].secondary_colour.slice();
	colours.unshift('RANDOM');

	return colours;
});
model.dFavouriteColour_secondary_alternative_options = ko.computed(function() {
	if(model.dFavouriteColour_primary_alternative() == 'RANDOM')
		return ['RANDOM'];

	var colours = dFavouriteColour_colourtable[model.dFavouriteColour_primary_alternative()].secondary_colour.slice();
	colours.unshift('RANDOM');

	return colours;
});
