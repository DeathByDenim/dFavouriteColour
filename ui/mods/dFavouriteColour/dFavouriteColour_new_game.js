(function() {

	var myprimarycolour = undefined;
	var mysecondarycolour = undefined;
	var myaltprimarycolour = undefined;
	var myaltsecondarycolour = undefined;
	var infinite_loop_prevent_counter = 0;
	var previoussecondarycolour = undefined;

	var myuberId = ko.observable('').extend({ session: 'uberId' })();

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
	var databindstring = $('.slot-color-primary-item').attr('data-bind');
	databindstring = databindstring.replace('slot.colorIndex($index())', 'model.dFavouriteColour_enabled = false; slot.colorIndex($index())');
	$('.slot-color-primary-item').attr('data-bind', databindstring);

	var oldhandlersplayers = handlers.players;
	handlers.players = function (payload, force) {
		oldhandlersplayers(payload, force);
		
		if(infinite_loop_prevent_counter > 40)
		{
			console.log("Infinite loop detected");
			return;
		}

		if(true/*model.dFavouriteColour_enabled*/) {
			var myslot = undefined;

			var armies = model.armies();
			for(var i = 0; i < armies.length; i++) {
				var slots = armies[i].slots();
				for(var j = 0; j < slots.length; j++) {
					if(slots[j].playerId() == myuberId) {
						myslot = slots[j];
						break;
					}
				}
				if(!_.isUndefined(myslot))
					break;
			}

			if(!_.isUndefined(myslot)) {
				if(!_.isUndefined(myprimarycolour) && myslot.primaryColor() === myprimarycolour.colour) {
					if(!_.isUndefined(mysecondarycolour) && myslot.secondaryColor() !== mysecondarycolour.colour && previoussecondarycolour !== myslot.secondaryColor()) {
						previoussecondarycolour = myslot.secondaryColor();
						model.send_message('next_secondary_color');
						infinite_loop_prevent_counter++;
					}
				}
				else if(!_.isUndefined(myaltprimarycolour) && myslot.primaryColor() === myaltprimarycolour.colour) {
					if(!_.isUndefined(myprimarycolour) && !model.colors()[myprimarycolour.index].taken) {
						model.send_message('set_primary_color_index', myprimarycolour.index);
					}
					else
					{
						if(!_.isUndefined(myaltsecondarycolour) && myslot.secondaryColor() !== myaltsecondarycolour.colour && previoussecondarycolour !== myslot.secondaryColor()) {
							previoussecondarycolour = myslot.secondaryColor();
							model.send_message('next_secondary_color');
							infinite_loop_prevent_counter++;
						}
					}
				}
				else {
					if(!_.isUndefined(myaltprimarycolour) )
						model.send_message('set_primary_color_index', myaltprimarycolour.index);
					if(!_.isUndefined(myprimarycolour))
						model.send_message('set_primary_color_index', myprimarycolour.index);
				}
			}
		}
	}

})();
