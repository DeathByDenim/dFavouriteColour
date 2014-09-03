(function() {

	primaryChanged = function(newValue) {
		var colours = [];
		if(newValue in dFavouriteColour_colourtable) {
			colours = dFavouriteColour_colourtable[newValue].secondary_colour.slice();
		}
		colours.unshift('RANDOM');

		api.settings.definitions.ui.settings.dFavouriteColour_secondary.options=colours;
		model.settingDefinitions(api.settings.definitions);
	}

	primaryAlternativeChanged = function(newValue) {
		var colours = [];
		if(newValue in dFavouriteColour_colourtable) {
			colours = dFavouriteColour_colourtable[newValue].secondary_colour.slice();
		}
		colours.unshift('RANDOM');

		api.settings.definitions.ui.settings.dFavouriteColour_secondary_alternative.options=colours;
		model.settingDefinitions(api.settings.definitions);
	}

	_.extend(api.settings.definitions.ui.settings, {

		dFavouriteColour_primary: {
			title: 'Favourite primary colour',
			type: 'select',
			options: ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'],
			default: 'RANDOM',
			callback: primaryChanged
		},

		dFavouriteColour_secondary: {
			title: 'Favourite secondary colour',
			type: 'select',
			options: ['RANDOM'],
			default: 'RANDOM'
		},

		dFavouriteColour_primary_alternative: {
			title: 'Favourite primary colour alternative',
			type: 'select',
			options: ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'],
			default: 'RANDOM',
			callback: primaryAlternativeChanged
		},

		dFavouriteColour_secondary_alternative: {
			title: 'Favourite secondary colour alternative',
			type: 'select',
			options: ['RANDOM'],
			default: 'RANDOM'
		}
	});

	primaryChanged(api.settings.value('ui','dFavouriteColour_primary'));
	primaryAlternativeChanged(api.settings.value('ui','dFavouriteColour_primary_alternative'));

	$('.ui').children().append(
		'                            <div class="sub-group">\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_secondary\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary_alternative\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_secondary_alternative\'] }"></div>\n' +
		'                            </div>\n'
	);

})();
