(function() {

	var myprimarycolour = undefined;
	var myaltprimarycolour = undefined;
	var infinite_loop_prevent_counter = 0;
	var previoussecondarycolour = undefined;

	var myuberDisplayName = ko.observable('').extend({ session: 'displayName' })();

	model.dFavouriteColour_enabled = true;

	// Retrieve the favourite colours from the settings if they exist.
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_primary', true)) && api.settings.value('ui','dFavouriteColour_primary') in dFavouriteColour_colourtable)
		myprimarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_primary')];
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_primary_alternative', true)) && api.settings.value('ui','dFavouriteColour_primary_alternative') in dFavouriteColour_colourtable)
		myaltprimarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_primary_alternative')];

	// Manually choosing a colour should disable this mod temporarily.
	var databindstring = $('.slot-color-primary-item').attr('data-bind');
	databindstring = databindstring.replace('slot.colorIndex($index())', 'model.dFavouriteColour_enabled = false; slot.colorIndex($index())');
	$('.slot-color-primary-item').attr('data-bind', databindstring);

	var oldhandlersplayers = handlers.players;
	handlers.players = function (payload, force) {
		oldhandlersplayers(payload, force);
		
		if(infinite_loop_prevent_counter > 40) {
			console.log("Infinite loop detected");
			model.dFavouriteColour_enabled = false;
			return;
		}

		if(model.dFavouriteColour_enabled) {
			if(!_.isUndefined(myaltprimarycolour) )
				model.send_message('set_primary_color_index', myaltprimarycolour.index);
			if(!_.isUndefined(myprimarycolour))
				model.send_message('set_primary_color_index', myprimarycolour.index);
		}
	}

})();
