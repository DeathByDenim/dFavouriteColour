(function() {
	_.extend(api.settings.definitions.ui.settings, {

		dFavouriteColour_primary: {
			title: 'Favourite primary colour',
			type: 'select',
			options: ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'],
			default: 'RANDOM'
		},

		dFavouriteColour_primary_alternative: {
			title: 'Favourite primary colour alternative',
			type: 'select',
			options: ['RANDOM', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'LIGHT BLUE', 'RED', 'PINK', 'DARK BLUE', 'YELLOW', 'BROWN'],
			default: 'RANDOM'
		}
	});
	model.settingDefinitions(api.settings.definitions);

	$('.ui').children().append(
		'                            <div class="sub-group">\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary_alternative\'] }"></div>\n' +
		'                            </div>\n'
	);

})();
