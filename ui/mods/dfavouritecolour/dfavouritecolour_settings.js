(function() {
	exports={};
	loadScript('coui://ui/mods/dfavouritecolour/color_table.js');
	var dFavouriteColour_colourtable=_.map(colours, function(colour) { return "rgb("+colour[0]+","+colour[1]+","+colour[2]+")"; });
	dFavouriteColour_colourtable = ['RANDOM'].concat(dFavouriteColour_colourtable);
	console.log(dFavouriteColour_colourtable);
	_.extend(api.settings.definitions.ui.settings, {

		dFavouriteColour_primary: {
			title: 'Favourite primary colour',
			type: 'select',
			options: dFavouriteColour_colourtable,
			default: 'RANDOM'
		},

		dFavouriteColour_secondary: {
			title: 'Favourite secondary colour',
			type: 'select',
			options: dFavouriteColour_colourtable,
			default: 'RANDOM'
		},

		dFavouriteColour_primary_alternative: {
			title: 'Favourite primary colour alternative',
			type: 'select',
			options: dFavouriteColour_colourtable,
			default: 'RANDOM'
		},

		dFavouriteColour_secondary_alternative: {
			title: 'Favourite secondary colour alternative',
			type: 'select',
			options: dFavouriteColour_colourtable,
			default: 'RANDOM'
		}
	});
	model.settingDefinitions(api.settings.definitions);

	$('.ui').children().append(
		'                            <div class="sub-group colours">\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_secondary\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_primary_alternative\'] }"></div>\n' +
		'                                <div class="option" data-bind="template: { name: \'setting-template\', data: $root.settingsItemMap()[\'ui.dFavouriteColour_secondary_alternative\'] }"></div>\n' +
		'                            </div>\n'
	);

	window.setTimeout(
		function(){$('.colours').find('.inner').each(function(n, el) {
			$(el).children().find('.text').each(function(n2,el2) {
				if(el2.innerText !== 'RANDOM') {
					el2.style.backgroundColor=el2.innerText
				}
			});
		})}
		,
		1000
	);
})();
