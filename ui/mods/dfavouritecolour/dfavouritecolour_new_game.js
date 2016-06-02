(function() {

	// Load the available colours from a copy of media/serverscripts/color_table.js
	// which I cannot access directly, I think.
	exports={};
	loadScript('coui://ui/mods/dfavouritecolour/color_table.js');

	// Convert it into a easy to use format with the colours in css form as
	// well as get their indexes.
	var i = 0;
	var dFavouriteColour_colourtable = {};
	_(colours).forEach(function(colour) {
		var entry = {
			colour: "rgb("+colour[0]+","+colour[1]+","+colour[2]+")",
			primary_index: i
		};
		i++;
		dFavouriteColour_colourtable[entry.colour] = entry;
	}).value();

	var myprimarycolour = undefined;
	var mysecondarycolour = undefined;
	var myaltprimarycolour = undefined;
	var myaltsecondarycolour = undefined;
	var infinite_loop_prevent_counter = 0;
	var ignore_next_one = false;
	var previoussecondarycolour = undefined;

	var myuberDisplayName = ko.observable('').extend({ session: 'displayName' })();

	// For manually selecting a colour or in case of errors.
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

		if(model.dFavouriteColour_enabled) {
			if(infinite_loop_prevent_counter > 40) {
				console.log("Infinite loop detected");
				model.dFavouriteColour_enabled = false;
				return;
			}
			infinite_loop_prevent_counter++;

			var myslot = undefined;
			var primarycolourtaken = false;
			var altprimarycolourtaken = false;

			var armies = model.armies();
			for(var i = 0; i < armies.length; i++) {
				var slots = armies[i].slots();
				for(var j = 0; j < slots.length; j++) {
					if(slots[j].playerName() === myuberDisplayName) {
						myslot = slots[j];
						break;
					}
					else if(!_.isUndefined(myprimarycolour) && slots[j].primaryColor() === myprimarycolour.colour) {
						primarycolourtaken = true;
					}
					else if(!_.isUndefined(myaltprimarycolour) && slots[j].primaryColor() === myaltprimarycolour.colour) {
						altprimarycolourtaken = true;
					}
				}
			}

			if(_.isUndefined(myslot))
				return;

			if(!_.isUndefined(myprimarycolour) && myslot.primaryColor() !== myprimarycolour.colour && !primarycolourtaken)
			{	// Set the primary colour
				console.log("Setting primary colour");
				model.send_message('set_primary_color_index', myprimarycolour.primary_index);
			}
			else if( (_.isUndefined(myprimarycolour) || myslot.primaryColor() === myprimarycolour.colour) && myslot.secondaryColor() !== mysecondarycolour.colour)
			{	// Set the secondary colour
				var secondarycoloursforthisprimarycolour = model.secondaryColors(myslot);
				var secondaryindex = secondarycoloursforthisprimarycolour.indexOf(mysecondarycolour.colour);
				if(secondaryindex >= 0) {
					console.log("Setting secondary colour");
					model.send_message('set_secondary_color_index', secondaryindex);
				}
			}
			else if(_.isUndefined(myprimarycolour) || (myslot.primaryColor() !== myprimarycolour.colour && primarycolourtaken) )
			{	// If either the primary colour is not set or if it's already taken, then try the alternative
				if(!_.isUndefined(myaltprimarycolour) && myslot.primaryColor() !== myaltprimarycolour.colour && !altprimarycolourtaken)
				{	// Set the alternative primary colour
					console.log("Setting alternative primary colour");
					model.send_message('set_primary_color_index', myaltprimarycolour.primary_index);
				}
				else if( (_.isUndefined(myaltprimarycolour) || myslot.primaryColor() === myaltprimarycolour.colour) && myslot.secondaryColor() !== myaltsecondarycolour.colour)
				{	// Set the alternative secondary colour
					var secondarycoloursforthisprimarycolour = model.secondaryColors(myslot);
					var secondaryindex = secondarycoloursforthisprimarycolour.indexOf(myaltsecondarycolour.colour);
					if(secondaryindex >= 0) {
						console.log("Setting alternative secondary colour");
						model.send_message('set_secondary_color_index', secondaryindex);
					}
				}
			}
		}
	}

})();
