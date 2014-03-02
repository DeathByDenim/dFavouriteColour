var model;

$(document).ready(function () {

   // Click handler for social chat button
    $('#social-chat').click(function() {
        model.pageMessage('Why destroy a planet when you can chat with your friends?');
    });

   // Click handler for friends button
    $('#social-friends').click(function() {
        model.pageMessage('As soon as you can have friends, you can talk to them!');
    });

    function respondToResize() {
        model.containerHeight(($("body").height() - 128)+'px');
        model.containerWidth(($("body").width() - 15)+'px');
        model.armyListHeight(($("#main .wrapper").height() - 52)+'px');
        model.chatHeight(($("#sidebar .content").height() - $("#system").height() - 235)+'px');
    }

    function PlayerViewModel(name, commander, badges, is_player) {
        var self = this;

        self.name = ko.observable(name);
        self.commander = ko.observable(commander);
        self.badges = badges ? badges.map(function (e) { return getCatalogItem(e); }) : null;
        self.commanderImageSource = commander.ImgSource;        
        self.isPlayer = ko.observable(is_player);
    }

    function SlotViewModel(options /* ai economy_factor */) {
        var self = this;
        var states = ['empty', 'player', 'ai']

        self.player = ko.observable(null);
        self.stateIndex = ko.observable(options.ai ? 2 : 0);
        self.isEmpty = ko.computed(function () { return self.stateIndex() === 0 });
        self.isPlayer = ko.computed(function () { return self.stateIndex() === 1 });
        self.isAI = ko.computed(function () { return self.stateIndex() === 2 });
        self.hover = ko.observable(false);
        self.setIsAI = function (make_ai) { self.stateIndex(make_ai ? 2 : 0) };

        self.economyFactor = ko.observable(_.isFinite(options.economy_factor) ? options.economy_factor : 1);

        self.easyAi = ko.computed(function () { return self.economyFactor() < 1; });
        self.normalAi = ko.computed(function () { return self.economyFactor() === 1; });
        self.hardAi = ko.computed(function () { return self.economyFactor() > 1; });

        self.playerName = ko.observable();
        self.primaryColor = ko.observable('');
        self.secondaryColor = ko.observable('');
        self.commander = ko.observable(''); /* { ObjectName UnitSpec } */
        self.commanderName = ko.computed(function () { return self.commander() ? self.commander().ObjectName : ''; });
        self.commanderImage = ko.computed(function () { return self.commander() ? self.commander().ProfileImgSource : ''; });

        self.updateFromJson = function (json) {
            if (_.isEmpty(json)) {
                self.stateIndex(0);
                self.playerName('');
            }
            else if (json.name) {
                self.stateIndex(1);
                self.playerName(json.name);
            }

            if (json.color) {
                self.primaryColor('rgb(' + json.color[0].join() + ')');
                self.secondaryColor('rgb(' + json.color[1].join() + ')');
            }

            if (json.commander) {
                self.commander(getCatalogItem(json.commander.ObjectName));
            }

            if (json.economy_factor) {
                self.economyFactor(json.economy_factor ? json.economy_factor : 1);
            }
        };

        self.clearPlayers = function () {
            if (self.isPlayer())
                self.stateIndex(0);

            self.primaryColor = ko.observable('');
            self.secondaryColor = ko.observable('');
        };

        self.asJson = function() {
            return self.isAI() ? 'ai' : 'player';
        }

        self.containsThisPlayer = ko.computed(function () {
            return self.playerName() === model.displayName();
        });
    }

    function ArmyViewModel(army_index, options /* slots alliance ai economy_factor */) {
        var self = this;

        self.index = ko.observable(army_index);

        self.aiArmy = ko.observable(!!options.ai);
        self.aiArmy.subscribe(function (value) {
            _.invoke(self.openSlots(), 'setIsAI', !!value);
        });
        self.toggleAiControl = function () {
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { ai: !self.aiArmy() }
            });
        };

        self.economyFactor = ko.observable(_.isFinite(options.economy_factor) ? options.economy_factor : 1);
        self.economyFactor.subscribe(function (value) {
            _.invoke(self.openSlots(), 'economyFactor', value);
        });

        var level = '2';
        if (self.economyFactor() === 0)
            level = '0';
        else if (self.economyFactor() < 1)
            level = '1';
        else if (self.economyFactor() > 1)
            level = '3';
        
        self.aiLevel = ko.observable(level); /* 0:easy 1:normal 2:hard 3:sandbox */
        self.aiLevel.subscribe(function (value) {
            switch (value) {
                case '0': self.economyFactor(0); break;
                case '1': self.economyFactor(0.5); break;
                case '2': self.economyFactor(1.0); break;
                case '3': self.economyFactor(1.5); break;              
            };
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { economy_factor: self.economyFactor() }
            });
        });

        self.openSlots = ko.observableArray([]);

        var slot_count = options ? options.slots : 1;
        for (var i = 0; i < slot_count; i++)
            self.openSlots().push(new SlotViewModel({ ai: self.aiArmy(), economy_factor: self.economyFactor() }));

        self.allianceGroup = ko.observable(0);
        self.maxAllianceGroup = ko.observable(6);
        self.allianceGroupImageSource = ko.computed(function () {
            return '../shared/img/alliance_group/alliance_group_' + self.allianceGroup() + '.png';
        });

        self.numberOfSlots = ko.computed(function () { return self.openSlots().length; });

        self.alliance = ko.observable(!!options.alliance);
        self.sharedArmy = ko.computed(function () { return !self.alliance(); });

        self.showToggleSharedArmy = ko.computed(function () {
            return model.isTeamGame() && self.numberOfSlots() > 1;
        });
        self.toggleSharedArmy = function () {
            if (!model.isGameCreator())
                return;

            model.send_message('modify_army', {
                army_index: self.index(),
                options: { alliance: !self.alliance() }
            });
        };

        self.metal = ko.observable(1000);
        self.energy = ko.observable(1000);
        self.rate = ko.observable(1.0);

        self.changeAllianceGroup = function () {
            self.allianceGroup((self.allianceGroup() + 1) % self.maxAllianceGroup());
        }

        self.showAddSlot = ko.computed(function () {
            return self.numberOfSlots() < 5 && model.isGameCreator();
        });
        self.addSlot = function () {
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { slots: self.numberOfSlots() + 1 }
            });
        }

        self.showRemoveSlot = function () {
            return self.numberOfSlots() > 1;
        }
        self.removeSlot = function () {
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { slots: self.numberOfSlots() - 1 }
            });
        }

        self.join = function () {
            if (self.aiArmy())
                return;

            console.log('join');
            model.send_message('join_army', {
                army: self.index(),
                commander: { ObjectName: model.preferredCommander().ObjectName }
            });
        };

        self.leave = function () {
            console.log('leave');
            model.send_message('leave_army');
        };

        self.nextPrimaryColor = function () {
            console.log('color');
            model.send_message('next_primary_color');
        };

        self.nextSecondaryColor = function () {
            model.send_message('next_secondary_color');
        };

        self.clearPlayers = function () {
            _.forEach(self.openSlots(), function (element) {
                element.clearPlayers();
            });
        }

        self.addPlayer = function (options /* name, id, [color] */) {
            _.forEach(self.openSlots(), function (element) {
                if (element.isEmpty()) {
                    element.updateFromJson(options);
                    return false; /* early out */
                }
            });
        }

        self.updateFromJson = function (json) {
            
        };

        self.asJson = function() {
            return {
                slots: _.invoke(self.openSlots(), 'asJson'),
                alliance : self.alliance(),
                ai: self.aiArmy(),
                economy_factor: self.economyFactor()
            }
        };

        self.armyContainsThisPlayer = function () {
            return !!(_.find(self.openSlots(), function (s) { return (s.playerName() == model.displayName()); }));
        };

        self.slotTag = ko.computed(function () { return (self.aiArmy()) ? loc("!LOC(new_game:ai_commander.message):AI Commander") : loc("!LOC(new_game:player_slot.message):Player Slot") })
        self.addSlotTag = ko.computed(function () { return (self.aiArmy()) ? loc("!LOC(new_game:add_ai_commander.message):Add AI Commander") : loc("!LOC(new_game:add_slot.message):Add Slot") })
    }

    function ChatMessageViewModel(name, type, payload) {
        var self = this;

        self.username = ko.observable(name);
        self.typeArray = ['invalid', 'enter', 'exit', 'lobby', 'whisper', 'global', 'team'];
        self.typeIndex = ko.observable(0);
        self.typeString = ko.computed(function () { return self.typeArray[self.typeIndex]; });
        self.payload = ko.observable(payload);

        var t = 0;
        var i;
        for (i = 0; i < self.typeArray; i++)
            if (self.typeArray[i] === type)
                t = i;

        self.typeIndex(t);
    }

    function NewGameViewModel() {
        var self = this;

       // Click handler for leave button
        self.leave = function() {
            model.send_message('leave');
            _.delay(function() { 
                window.location.href = '../start/start.html';
            }, 30);
        };

        // Set up messaging for the social bar
        self.pageMessage = ko.observable();

        // Set up dynamic sizing elements
        self.containerHeight = ko.observable('600px');
        self.containerWidth = ko.observable('600px');
        self.armyListHeight = ko.observable('600px');
        self.chatHeight = ko.observable('400px');

        self.chatSelected = ko.observable(false);
        self.chatMessages = ko.observableArray([]);
        self.sendChat = function (message) {
            var msg = {};
            msg.message = $(".input_chat_text").val();

            if (msg.message) {
                model.send_message("chat_message", msg);
            }
            msg.message = $(".input_chat_text").val("");
        };

        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.offline = ko.observable().extend({ session: 'offline' });

        self.uberName = ko.observable().extend({ local: 'uberName' });
        self.displayName = ko.observable('').extend({ session: 'displayName' });
        self.uberId = ko.observable().extend({ local: 'uberId' });
        self.preferredCommander = ko.observable().extend({ local: 'preferredCommander' });
        
        self.extendedCatalog = ko.observableArray(baseCatalog).extend({ session: 'extendedCatalog' });
        self.commanders = ko.computed(function () {
            return _.filter(self.extendedCatalog(), function (element) { return element.UnitSpec });
        });
        self.badges = ko.computed(function () {
            return _.filter(self.extendedCatalog(), function (element) { return !element.UnitSpec });
        });

        self.selectedCommanderIndex = ko.observable(0);
        self.selectedCommander = ko.computed(function () { return self.commanders()[self.selectedCommanderIndex()] });

        self.changeCommander = function () {
            console.log('changeCommander');

            self.selectedCommanderIndex((self.selectedCommanderIndex() + 1) % self.commanders().length);

            model.send_message('update_commander', {
                commander: { ObjectName: self.selectedCommander().ObjectName }
            });
        };


        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.buildVersion = ko.observable().extend({ session: 'build_version' });
        self.isFriendsOnlyGame = ko.observable(false).extend({ session: 'is_friends_only_game' });
        self.toggleFriendsOnlyGame = function() { 
            self.isFriendsOnlyGame(!self.isFriendsOnlyGame()); 
            if (self.isFriendsOnlyGame())
                self.isPublicGame(false);
        };
        self.isLocalGame = ko.observable().extend({ session: 'isLocalGame' });
        self.isPublicGame = ko.observable(false).extend({ session: 'is_public_game' });
        self.togglePublicGame = function() { 
            self.isPublicGame(!self.isPublicGame()); 
            if (self.isPublicGame())
                self.isFriendsOnlyGame(false);
        };
        self.isHiddenGame = ko.computed(function() { return !self.isFriendsOnlyGame() && !self.isPublicGame(); });
        self.setHiddenGame = function() { 
            self.isFriendsOnlyGame(false);
            self.isPublicGame(false);
        };
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });

        self.friends = ko.observableArray([]).extend({ local: 'approvedFriends' });
        self.blocked = ko.observableArray([]).extend({ local: 'blockedFriends' });

        self.createdGameId = ko.observable();
        self.lobbyId = ko.observable();

        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.waitingString = ko.observable('');

        self.teamTypes = ['FreeForAll', 'TeamArmies', 'Alliance', 'VersusAI'];
        self.selectedTeamTypeIndex = ko.observable('0');

        self.allowResetArmiesOnChange = ko.observable(false);

        self.selectedTeamTypeIndex.subscribe(function (value) {
            if (self.allowResetArmiesOnChange())
                self.resetArmies();
        });

        self.teamType = ko.computed(function () {
            return self.teamTypes[self.selectedTeamTypeIndex()];
        });

        self.isTeamGame = ko.computed(function () {
            return self.selectedTeamTypeIndex() == 1; /* expecting coercion */
        });

        self.armies = ko.observableArray([]);

        self.spectators = ko.observableArray([]);

        self.enableLan = ko.computed(function () {
            return self.isLocalGame() && (self.teamType() !== 'VersusAI');
        });

        self.nextSceneUrl = ko.observable().extend({ session: 'next_scene_url' });

        self.systems = ko.observableArray([]).extend({ local: 'systems' });

        self.isGameCreator = ko.observable(false);
        self.isNotGameCreator = ko.computed(function() { return !self.isGameCreator(); });

        self.createdGameDesc = ko.observable({}).extend({ session: 'created_game_description' });
        self.writeGameDesc = function () {
            var desc = {
                type : self.selectedTeamTypeIndex(),
                system : self.loadedSystem(),
                enable_lan : self.enableLan(),
                spectators : self.spectators().length,
                password : self.privateGamePassword(),
                friends : self.isFriendsOnlyGame() ? self.friends().map(function (e) { return e.FriendUberId;}) : [],
                public : self.isPublicGame(),
                blocked: self.blocked().map(function (e) { return e.FriendUberId; }),
            };

            self.createdGameDesc(desc);
            return desc;
        }
        self.createdGameDescIsEmpty = ko.computed(function () {
            return jQuery.isEmptyObject(self.createdGameDesc());
        });

        self.slots = ko.computed(function () {
            var slots = 0;
            for (i = 0; i < self.armies().length; i++)
                slots += self.armies()[i].numberOfSlots();

            return slots;
        });

        self.playerSlots = ko.computed(function () {
            var slots = 0;
            for (i = 0; i < self.armies().length; i++)
                if (!self.armies()[i].aiArmy())
                    slots += self.armies()[i].numberOfSlots();

            return slots;
        });

        self.playerCount = ko.computed(function () {
            return self.playerSlots() + self.spectators().length;
        });

        self.gameModeString = ko.computed(function () {
            return self.teamType() + self.playerCount();
        });

        self.teamDescription = function() {
            switch (self.selectedTeamTypeIndex()) {
                case '0': return 'Slot';
                case '1': return 'Team';
            }
        }

        self.armyIsMalformedInfo = ko.observable("");

        self.armyIsMalformed = ko.computed(function () {

            self.armyIsMalformedInfo("");
            if (self.selectedTeamTypeIndex() === 3) {
                if (self.playerSlots() < 1) {
                    self.armyIsMalformedInfo(loc("!LOC(new_game:you_must_have_a_player_slot_before_publishing.message):You must have a player slot before publishing."));
                    return true;
                }
                return false;
            }

//			if (self.playerSlots() < 2) {
//				self.armyIsMalformedInfo(loc("!LOC(new_game:you_must_have_two_player_slots_before_publishing.message):You must have two player slots before publishing."));
//				return true;
//			}

            if (self.selectedTeamTypeIndex() === 0)
                return false;

            if (self.selectedTeamTypeIndex() === 1) {
                if (self.slots() === self.armies().length) {
                    self.armyIsMalformedInfo(loc("!LOC(new_game:you_must_add_an_extra_slot_before_publishing.message):You must add an extra slot before publishing."));
                    return true;
                }
            }

            return false;
        });
        
        self.slotsAreEmptyInfo = ko.observable('');
        self.slotsAreEmpty = ko.computed(function() {
            var result = _.some(self.armies(), function(army) {
                if (army.aiArmy())
                    return false;
                return _.some(army.openSlots(), function(slot) {
                    return slot.isEmpty();
                });
            })
            if (result)
                self.slotsAreEmptyInfo("All slots must be filled.");
            else
                self.slotsAreEmptyInfo('');
            return result;
        });

        self.friendsAreMissingInfo = ko.observable('');
        self.friendsAreMissing = ko.computed(function () { 
            var result = self.isFriendsOnlyGame() && !self.friends().length;
            if (result)
                self.friendsAreMissingInfo(loc("!LOC(new_game:you_need_friends.message):You must have friends to play a friends-only game."));
            else
                self.friendsAreMissingInfo('');
            return result;
        });

        self.gameIsNotOkInfo = ko.computed(function() { 
            return self.armyIsMalformedInfo() || self.friendsAreMissingInfo() || self.slotsAreEmptyInfo();
        });
        self.gameIsNotOk = ko.computed(function () { return self.armyIsMalformed() || self.friendsAreMissing() || self.slotsAreEmpty(); });

        self.showAddSlot = ko.computed(function () {
            if (self.selectedTeamTypeIndex() === '0')
                return false

            if (self.slots() >= 10)
                return false;

            return true;
        });

        self.showAddArmy = ko.computed(function () {
            if (self.playerCount() >= 10)
                return false;

            return self.armies().length < 10;
        });

        self.hideAddArmy = ko.computed(function () {
            return !self.showAddArmy();
        });

        self.addArmy = function () {
            self.send_message('add_army', { options: { slots: 1, ai: false, alliance: false } });
        };

        self.addSpectator = function () {
        };

        self.showRemoveArmy = ko.computed(function () {
            return self.armies().length > 2 && self.isGameCreator();
        });
        self.removeArmy = function (army_index) {
            self.send_message('remove_army', { army_index: 0 } );
        };

        self.showRemoveSpectator = ko.computed(function () { return self.spectators().length > 0; });
        self.removeSpectator = function () {
        };

        self.showAllianceGroup = ko.computed(function () { return self.teamType() === 'Alliance' });

        self.resetArmies = function () {

            if (!self.isGameCreator())
                return;

            while (self.armies().length)
                self.armies().pop();

            if (self.selectedTeamTypeIndex() == 0) { /* FFA */
                self.send_message('reset_armies', [
                    { slots: 1, ai: false, alliance: false },
                    { slots: 1, ai: false, alliance: false }
                ]);
            }
            else { /* TEAM */
                self.send_message('reset_armies', [
                   { slots: 2, ai: false, alliance: true },
                   { slots: 2, ai: false, alliance: true }
                ]);
            }

            if (model.loadedSystemIsEmpty()) {
                if (model.loadedPlanetIsEmpty())
                    model.loadRandomSystem();
                else
                    model.createSystemFromLoadedPlanet();
            }

            self.updateGameConfig();
        };

        self.loadFromGameDesc = function () {

        }

        this.resetPlayerPattern = function () { self.selectedPlayerPatternIndex = 0; }

        this.navToServerBrowser = function () {
            self.writeGameDesc();
            window.location.href = '../server_browser/server_browser.html';
        }

        self.newGameWhenLoaded = ko.observable(false).extend({ session: 'new_game_when_loaded' });

        self.navToEditPlanet = function () {
            self.lastSceneUrl('../new_game/new_game.html');
            self.nextSceneUrl('../new_game/new_game.html');
      
            self.writeGameDesc();
            window.location.href = '../load_planet/load_planet.html';
        }

        // TODO: Remove when planets are generated using the new schema
        self.fixupPlanetConfig = function (desc) {
 
            if (!desc.system.planets)
                desc.system.planets = [];
            var planets = desc.system.planets || [];
            for (var p = 0; p < planets.length; ++p)
            {
                var planet = planets[p];
                if (planet.hasOwnProperty('position_x'))
                {
                    planet.position = [planet.position_x, planet.position_y];
                    delete planet.position_x;
                    delete planet.position_y;
                }
                if (planet.hasOwnProperty('velocity_x'))
                {
                    planet.velocity = [planet.velocity_x, planet.velocity_y];
                    delete planet.velocity_x;
                    delete planet.velocity_y;
                }
                if (planet.hasOwnProperty('planet'))
                {
                    planet.generator = planet.planet;
                    delete planet.planet;
                }
            }
            return desc;
        }
        
        // TODO: Remove when planets are generated using the new schema
        self.unfixupPlanetConfig = function (system) {
            console.log(system);
            if (!system.planets)
                system.planets = [];

            var planets = system.planets || [];
            for (var p = 0; p < planets.length; ++p)
            {
                var planet = planets[p];
                if (planet.hasOwnProperty('position'))
                {
                    planet.position_x = planet.position[0];
                    planet.position_y = planet.position[1];
                    delete planet.position;
                }
                if (planet.hasOwnProperty('velocity'))
                {
                    planet.velocity_x = planet.velocity[0];
                    planet.velocity_y = planet.velocity[1];
                    delete planet.velocity;
                }
                if (planet.hasOwnProperty('generator'))
                {
                    planet.planet = planet.generator;
                    delete planet.generator;
                }
            }
            return system;
        }
        
        /* 'publish' is deprecated. instead 'updateGameConfig' */
        self.publish = function () {

            model.selectedTeamTypeIndex(model.selectedTeamTypeIndex());

            var desc = self.writeGameDesc();
            self.send_message('game_config', self.fixupPlanetConfig(desc), function(success) {
                if (!success)
                {
                    // TODO: Display error
                }
            });
        }

        /* change the server js state to reflect the desired configuration */
        self.updateGameConfig = function () {

            if (!self.isGameCreator())
                return;

            var desc = self.fixupPlanetConfig(self.writeGameDesc());

            self.send_message('update_game_config', desc);
        }

        self.spectators.subscribe(self.updateGameConfig);
        self.isFriendsOnlyGame.subscribe(self.updateGameConfig);
        self.isPublicGame.subscribe(self.updateGameConfig);

        /* signal server to start building planets and start the game */
        self.showStartGameError = ko.observable(false);
        self.startGame = function () {
            if (self.gameIsNotOk()) {
                self.showStartGameError(true);
                return;
            }
            
            self.updateGameConfig(); /* ensure we have latest config */
            self.send_message('start_game');
        }

        self.loadedSystem = ko.observable({}).extend({ session: 'loaded_system' });
        self.loadedSystemIsEmpty = ko.computed(function () { return jQuery.isEmptyObject(self.loadedSystem()); });
        self.loadedSystemSize = ko.computed(function () { if (!self.loadedSystemIsEmpty()) return self.loadedSystem().planets.length; else return 0; });
        self.primaryPlanet = ko.computed(function ()
        {
            if (!self.loadedSystemIsEmpty())
                return self.loadedSystem().planets[0].planet;
            return {};
        });
        self.otherPlanets = ko.computed(function () {

            if (self.loadedSystemIsEmpty()) {
                return ["empty","empty","empty","empty","empty","empty","empty","empty","empty"];
            }
            var s = self.loadedSystem().planets;

            var planets = [];

            for (var i=1; i<s.length; i++) { planets.push(s[i].planet.biome); }
            for (var i=s.length; i<10; i++) { planets.push('empty'); }

            return planets;
        });

        self.loadedPlanet = ko.observable({}).extend({ session: 'loaded_planet' });
        self.planets = ko.observableArray([]).extend({ local: 'planets' });
        self.loadedPlanetIsEmpty = ko.computed(function () { return jQuery.isEmptyObject(self.loadedPlanet()); });

        self.biomes = ko.observableArray(['earth', 'moon', 'tropical', 'lava', 'metal']);

        self.getRandomPlanet = function (radius) {

            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            var bp = {};
            bp.seed = getRandomInt(0, 32767);
            bp.radius = radius ? radius : getRandomInt(300, 500); /* HACK : force small planets */
            bp.heightRange = getRandomInt(0, 100);
            bp.biomeScale = 1;
            bp.waterHeight = getRandomInt(0, 60);
            bp.temperature = getRandomInt(0, 100);
            bp.biome = _.sample(self.biomes());
            bp.name = bp.biome;
            bp.index = 0;

            if (bp.biome === 'tropical') {
                bp.waterHeight = bp.waterHeight < 30 ? 30 : bp.waterHeight;
                bp.temperature = bp.temperature < 30 ? 30 : bp.temperature;
            }
            if (bp.biome === 'metal') {
                bp.radius = bp.radius < 500 ? 500 : bp.radius;
            }
            return bp;
        };

        self.loadRandomSystem = function () {
            var rSystem = {};
            rSystem.name = "Beta System";
            rSystem.planets = [
            {
                mass: 10000,
                position_x: 20000,
                position_y: 0,
                velocity_x: 0,
                velocity_y: 158.114,
                planet: self.getRandomPlanet()
            },
            {
                mass: 3000,
                position_x: 24000,
                position_y: 0,
                velocity_x: 0,
                velocity_y: 219.351,
                planet: self.getRandomPlanet(500)
            }];
            model.loadedSystem(rSystem);
        }

        self.setPrimaryPlanet = function (index) {
            var system = self.loadedSystem();
            var planets = self.loadedSystem().planets;
            planets.unshift(planets.splice(index, 1)[0]);
            
            system.planets = planets;
            self.loadedSystem(system);
        }

        self.createSystemFromLoadedPlanet = function () {
            var rSystem = {};
            rSystem.name = "Beta Test System";
            rSystem.planets = [
            {
                name: self.loadedPlanet().name,
                mass: 10000,
                position_x: 20000,
                position_y: 0,
                velocity_x: 0,
                velocity_y: 158.114,
                planet: self.loadedPlanet().planet
            },
            {
                mass: 3000,
                position_x: 24000,
                position_y: 0,
                velocity_x: 0,
                velocity_y: 219.351,
                planet: self.getRandomPlanet(500)
            }];
            model.loadedSystem(rSystem);
        }

        self.imageSourceForPlanet = function (planet) {

            var ice = planet.biome === 'earth' && planet.temperature <= -0.5;
            var s = (ice) ? 'ice' : planet.biome;
            s = (s) ? s : 'unknown';

            return '../shared/img/' + s + '.png';
        }

        self.imageSizeForPlanet = function (size) {
            return '' + 100 + 'px';
        }

        self.planetSizeClass = function (radius) {
            var surfaceArea = 4 * Math.PI * (radius * radius);
            if (surfaceArea <= 1000000)
                return '1';
            if (surfaceArea <= 6000000)
                return '2';
            if (surfaceArea <= 12000000)
                return '3';
            if (surfaceArea <= 18000000)
                return '4';
            if (surfaceArea <= 30000000)
                return '5';
            return 'unknown';
        }

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.navBack = function () {
            self.loadedPlanet({});
            self.loadedSystem({});
            if (self.lastSceneUrl()) 
                window.location.href = self.lastSceneUrl();
        };

        self.navToStart = function () {
            self.writeGameDesc();
            window.location.href = '../start/start.html';
        };

        self.cancel = function () {
            self.navToStart();
        };

    }
    model = new NewGameViewModel();

    handlers = {};

    handlers.game_config = function (payload) {
        console.log('gc');
        console.log(payload);

        /* ignore if we created the game, since it is just an echo */
        if (model.isGameCreator() || _.isEmpty(payload))
            return;

        model.createdGameDesc(payload);
        model.loadFromGameDesc();
    }

    handlers.chat_message = function (msg) {
        model.chatMessages.push(new ChatMessageViewModel(msg.player_name, 'lobby', msg.message));
        $("#chat-bar .container_embed").scrollTop($("#chat-bar .container_embed")[0].scrollHeight);
    };

    handlers.colors = function (payload) {
        //console.log('colors');

        var s = '';
        _.forEach(payload, function (element, index) {
            s += index + ' : ' + (element.taken ? 'taken' : 'free') + ' , ';
        });
        //console.log(s);
    }

    var prev_players = {};
    handlers.players = function (payload, force) {
        console.log('players');
        console.log(payload);
        //console.log(JSON.stringify(payload, null, '\t'));

        prev_players = payload;

        var prev = model.isGameCreator();

        _.invoke(model.armies(), 'clearPlayers');

        _.forEach(payload, function (element) {
            if (element.creator && element.name === model.displayName())
                model.isGameCreator(true);

            if (element.army_index !== -1 && model.armies().length > element.army_index) {
                model.armies()[element.army_index].addPlayer(element);
            }
        });

        if (!prev && model.isGameCreator() && !force) {
            model.resetArmies();
            model.updateGameConfig();
        }
    }

    /* from server_state.data.armies */
    handlers.armies = function (payload, force) {
        console.log('armies');
        console.log(payload);

        while (model.armies().length)
            model.armies().pop();

        _.forEach(payload, function (element, index) {
            model.armies.push(new ArmyViewModel(index, element));
        });

        handlers.players(prev_players);
    }

    handlers.control = function (payload) {
        console.log('control');
        console.log(payload);

        if (payload.starting)
            window.location.href = 'coui://ui/alpha/building_planets/building_planets.html';
    };

    handlers.settings = function (payload) {
        console.log('settings');
        console.log(payload);
        model.selectedTeamTypeIndex(payload.game_mode);
    };
    
    handlers.system = function (payload) {
        console.log('system');
        console.log(payload);
        
        var unfixedSystem = model.unfixupPlanetConfig(payload);
        
        if (model.isGameCreator()) {
            if (!_.isEqual(unfixedSystem, model.loadedSystem())) {
                model.updateGameConfig();
            }
            return;
        }

        model.loadedSystem(unfixedSystem);
    };

    handlers.server_state = function (payload) {
        if (payload.url && payload.url !== window.location.href)
            window.location.href = payload.url;

        console.log('server_state');
        console.log(payload);

        if (payload.data) {
            handlers.armies(payload.data.armies, true);
            handlers.players(payload.data.players, model.armies().length !== 0);
            handlers.colors(payload.data.colors);
            handlers.control(payload.data.control);
            handlers.settings(payload.data.settings);
            handlers.system(payload.data.system);
        }
    };

    handlers.connection_disconnected = function (payload) {
        model.transitPrimaryMessage(loc('!LOC(new_game:connection_to_server_lost.message):CONNECTION TO SERVER LOST'));
        model.transitSecondaryMessage(loc('!LOC(new_game:returning_to_main_menu.message):Returning to Main Menu'));
        model.transitDestination('../start/start.html');
        model.transitDelay(5000);
        window.location.href = '../transit/transit.html';
    }

    // inject per scene mods
    if (scene_mod_list['new_game'])
        loadMods(scene_mod_list['new_game']);
 
    app.registerWithCoherent(model, handlers);

    model.lastSceneUrl('../start/start.html');

    // Activates knockout.js
    ko.applyBindings(model);

    $("#radio").buttonset();

    $('body').keydown(
        function (event) {
            if (event.keyCode === keyboard.esc)
            {
                if (model.chatSelected())
                    model.chatSelected(false);
            }
            else if (event.keyCode === keyboard.enter)
            {
                if (model.chatSelected())
                    $(".chat_input_form").submit();

                model.chatSelected(true);
            }
        }
    );

    if (!model.preferredCommander())
        model.preferredCommander(getCatalogItem('AlphaCommander'));

    app.hello(handlers.server_state, handlers.connection_disconnected);

    // Set up resize event for window so we can smart-size the game list
    $(window).resize(respondToResize);
    respondToResize();
});
