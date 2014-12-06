(function() {

	var myprimarycolour = undefined;
	var mysecondarycolour = undefined;
	var myaltprimarycolour = undefined;
	var myaltsecondarycolour = undefined;
	var infinite_loop_prevent_counter = 0;
	var ignore_next_one = false;
	var previoussecondarycolour = undefined;

	var myuberDisplayName = ko.observable('').extend({ session: 'displayName' })();

	model.dFavouriteColour_enabled = true;

	// Retrieve the favourite colours from the settings if they exist.
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_primary', true)) && api.settings.value('ui','dFavouriteColour_primary') in dFavouriteColour_colourtable)
		myprimarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_primary')];
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_secondary', true)) && api.settings.value('ui','dFavouriteColour_secondary') in dFavouriteColour_colourtable)
		mysecondarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_secondary')];
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_primary_alternative', true)) && api.settings.value('ui','dFavouriteColour_primary_alternative') in dFavouriteColour_colourtable)
		myaltprimarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_primary_alternative')];
	if(!_.isUndefined(api.settings.isSet('ui','dFavouriteColour_secondary_alternative', true)) && api.settings.value('ui','dFavouriteColour_secondary_alternative') in dFavouriteColour_colourtable)
		myaltsecondarycolour = dFavouriteColour_colourtable[api.settings.value('ui','dFavouriteColour_secondary_alternative')];


	// Manually choosing a colour should disable this mod temporarily.
	var databindstring = $('.slot-color-primary-item:first').attr('data-bind');
	if(databindstring) {
		databindstring = databindstring.replace('slot.colorIndex($index())', 'model.dFavouriteColour_enabled = false; slot.colorIndex($index())');
		$('.slot-color-primary-item:first').attr('data-bind', databindstring);
	}

	var databindstring = $('.secondary').attr('data-bind');
	if(databindstring) {
		databindstring = databindstring.replace('slot.secondaryColorIndex($index())', 'model.dFavouriteColour_enabled = false; slot.secondaryColorIndex($index())');
		$('.secondary').attr('data-bind', databindstring);
	}


	// Override the players handler so we can steal our favourite colour, should it become
	// available again.
	var oldhandlersplayers = handlers.players;
	handlers.players = function (payload, force) {
		oldhandlersplayers(payload, force);

		if(ignore_next_one)
		{
			ignore_next_one = false;
			return;
		}

		if(model.dFavouriteColour_enabled) {
			if(infinite_loop_prevent_counter > 40) {
				console.log("Infinite loop detected");
				model.dFavouriteColour_enabled = false;
				return;
			}
			infinite_loop_prevent_counter++;

			if(!_.isUndefined(myaltprimarycolour) ) {
				ignore_next_one = true;

				model.send_message('set_primary_color_index', myaltprimarycolour.primary_index);
				if(!_.isUndefined(myaltprimarycolour) ) {
					model.send_message('set_secondary_color_index', myaltsecondarycolour.secondary_index);
				}
			}
			if(!_.isUndefined(myprimarycolour)) {
				ignore_next_one = true;

				model.send_message('set_primary_color_index', myprimarycolour.primary_index);
				if(!_.isUndefined(myaltprimarycolour) ) {
					model.send_message('set_secondary_color_index', mysecondarycolour.secondary_index);
				}
			}
		}
	}

})();
