/* Services */

angular.module('tilesIde.services', [])

.factory('$localStorage', ['$window', function($window) {
  return {
  	set: function(key, value) {
  		$window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
    	return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
    	$window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
    	return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])

.factory('appRecipes', ['$http', function($http){
	var o = {
		appRecipes: []
	};

	var escape = function (str) {
  		return str
    	.replace(/[\\]/g, '\\\\')
    	.replace(/[\"]/g, '\\\"')
    	.replace(/[\/]/g, '\\/')
    	.replace(/[\b]/g, '\\b')
    	.replace(/[\f]/g, '\\f')
    	.replace(/[\n]/g, '\\n')
    	.replace(/[\r]/g, '\\r')
    	.replace(/[\t]/g, '\\t');
	};

	o.getAll = function(userId) {
  		return $http.get('/appRecipes/' + userId).then(function(res){
  			angular.copy(res.data, o.appRecipes);
  		});
	}

	o.create = function(userId, appRecipe) {
  		return $http.post('/appRecipes/' + userId, JSON.stringify(appRecipe)).then(function(res){
    		o.appRecipes.push(res.data);
  		});
	}

	o.get = function(userId, appRecipe) {
  		return $http.get('/appRecipes/' + userId + '/' + appRecipe._id).then(function(res){
  			return res.data;
  		});
	}

	o.save = function(userId, appRecipe, callback) {
		var data = {
			code: appRecipe.code,
			group: appRecipe.group
		}
		return $http.put('/appRecipes/' + userId + '/' + appRecipe._id, JSON.stringify(data)).then(function(res){
			if (callback) callback();
		});
	}

	o.delete = function(userId, appRecipe) {
		return $http.delete('/appRecipes/' + userId + '/' + appRecipe._id).then(function(res){
			var index = o.appRecipes.indexOf(appRecipe);
			o.appRecipes.splice(index, 1);
		});
	}

	o.setActive = function(userId, appRecipe, active) {
		return $http.put('/appRecipes/' + userId + '/' + appRecipe._id + '/active', '{"active": ' + active + '}').then(function(res){
			appRecipe.active = active;
			return res.data;
		});
	}

	o.getCode = function(userId, appRecipe, callback) {
  		return $http.get('/appRecipes/' + userId + '/' + appRecipe._id + '/code').then(function(res){
  			callback(res);
  			return res.data;
  		});
	}

	return o;
}])

.factory('tiles', ['$http', function($http){
	var o = {
		tiles: [],
		client: null,
		userId: null
	};
	
	o.getAll = function(userId) {
  		return $http.get('/users/' + userId).then(function(res){
  			angular.copy(res.data.tiles, o.tiles);
  		});
	}

	o.initRealTimeUpdates = function(userId, callback){
		o.userId = userId;
		o.client = mqtt.connect({host: 'localhost', port: 8080, keepalive: 0});

		o.client.on('connect', function () {
	  		o.client.subscribe('tiles/evt/' + o.userId + '/+/+/active');
	  		o.client.subscribe('tiles/evt/' + o.userId + '/+/+/name');
		});

		o.client.on('message', function (topic, message) {
	  		var msgString = message.toString();
	  		var topicLevels = topic.split('/');
	  		
	  		if (topicLevels.length !== 6) return;

	  		var group = topicLevels[3];
	  		var tileId = topicLevels[4];

	  		if (topicLevels[5] === 'active') {
		  		setTile(tileId, msgString === 'true', group, null, callback);
		  	} else if (topicLevels[5] === 'name') {
	  			setTile(tileId, null, group, msgString, callback);
	  		}
  		});
	}

	function setTile(tileId, active, group, name, callback){
		var tile;
		for (var i = 0; i < o.tiles.length; i++) {
    		if (o.tiles[i]._id === tileId) {
    			tile = o.tiles[i];
    			break;
    		}
		}
		if (tile == null) {
			tile = {_id: tileId};
			o.tiles.push(tile);
		}
    	if (active != null) tile.active = active;
		if (group != null) tile.group = group;
		if (name != null) tile.name = name;

		if (callback) callback();
	}

	return o;
}])

.factory('content', function(){
	var o = {};
	o.editor = null;

	o.setEditor = function(editor){
		o.editor = editor;
	}
	return o;
})

.factory('mainSidebar', function(){
	var o = {};

	o.selectedAppRecipe = null;

	return o;
})

.factory('controlSidebar', function(){
	var o = {};
	
	o.isOpen = false;
	o.selectedTabIndex = 0;

	o.toggle = function(){
		o.isOpen = !o.isOpen;
	}

	o.open = function(tabIndex){
		o.isOpen = true;
		if (tabIndex !== undefined) o.selectTab(tabIndex);
	}

	o.selectTab = function(tabIndex){
		o.selectedTabIndex	= tabIndex;
		if (tabIndex === 1){
			setTimeout(function(){
				$('#documentation').slimScroll({
					height: (window.innerHeight - $('#documentation').offset().top) + 'px',
					color: '#ecf0f5'
				});
			}, 1);
		}
	}

	return o;
})

.factory('tileConsole', ['tiles', function(tiles){
	var o = {
		tile: null,
		subscribedTopic: null,
		publishTopic: null,
		command: {}
	};

	function getTopic(tile, type) {
		var group = tile.group || 'global';
		return 'tiles/' + type + '/' + tiles.userId + '/' + group + '/' + tile._id;
	}

	var listener = function (topic, message) {
		var msgString = message.toString();
		var topicLevels = topic.split('/');
	
		// Omit 'name' and 'active' events
		if (topicLevels.length !== 5) return;

		console.log('Tile console received msg: ' + msgString);
		addConsoleEntry('tileConsole', msgString + '\n');
	};

	o.setTile = function(tile) {
		o.tile = tile;

		o.subscribedTopic = getTopic(tile, 'evt');
		tiles.client.subscribe(o.subscribedTopic);

		o.publishTopic = getTopic(tile, 'cmd');
		
		console.log('Subscribed to: ' + o.subscribedTopic);
		console.log('Publish to: ' + o.publishTopic);

		tiles.client.on('message', listener);
	}

	o.detachTile = function() {
		if (o.subscribedTopic) {
			tiles.client.unsubscribe(o.subscribedTopic);
		}
		tiles.client.removeListener('message', listener);
		o.tile = null;
		o.command = {};
		clearConsole('tileConsole');
	}

	o.sendCommand = function() {
		if (o.publishTopic && o.tile) tiles.client.publish(o.publishTopic, JSON.stringify(o.command));
	}

	o.changeGroup = function(newGroup, oldGroup) {
		if (o.subscribedTopic && o.tile) {
			tiles.client.unsubscribe(o.subscribedTopic);
			o.subscribedTopic = getTopic(o.tile, 'evt');
			tiles.client.subscribe(o.subscribedTopic);
			addConsoleEntry('tileConsole', 'Group changed from "' + oldGroup + '" to "' + newGroup + '"\n', true);
		}
	}

	return o;
}])

.factory('configData', ['$http', function($http) {
	var o = {};

	o.save = function(userId, appRecipe, data) {
		return $http.put('/appRecipes/' + userId + '/' + appRecipe._id + '/config', JSON.stringify(data)).then(function(res){
			console.log('Saved successfully! Data: ' + JSON.stringify(res.data));
		});
	};

	o.fetch = function(userId, appRecipe, callback) {
  		return $http.get('/appRecipes/' + userId + '/' + appRecipe._id + '/config').then(function(res){
  			if (callback) callback(res.data);
  		});
	};

	return o;
}])

.factory('settings', ['content', '$localStorage', '$filter', function(content, $localStorage, $filter) {
	var o = {};

	o.aceThemes = [
		{name: 'Chrome', value: 'chrome', group: 'Bright'},
		{name: 'Clouds', value: 'clouds', group: 'Bright'},
		{name: 'Crimson Editor', value: 'crimson_editor', group: 'Bright'},
		{name: 'Dawn', value: 'dawn', group: 'Bright'},
		{name: 'Dreamweaver', value: 'dreamweaver', group: 'Bright'},
		{name: 'Eclipse', value: 'eclipse', group: 'Bright'},
		{name: 'GitHub', value: 'github', group: 'Bright'},
		{name: 'IPlastic', value: 'iplastic', group: 'Bright'},
		{name: 'Solarized Light', value: 'solarized_light', group: 'Bright'},
		{name: 'TextMate', value: 'textmate', group: 'Bright'},
		{name: 'Tomorrow', value: 'tomorrow', group: 'Bright'},
		{name: 'XCode', value: 'xcode', group: 'Bright'},
		{name: 'Kuroir', value: 'kuroir', group: 'Bright'},
		{name: 'KatzenMilch', value: 'katzenmilch', group: 'Bright'},
		{name: 'SQL Server', value: 'sqlserver', group: 'Bright'},
		{name: 'Ambiance', value: 'ambiance', group: 'Dark'},
		{name: 'Chaos', value: 'chaos', group: 'Dark'},
		{name: 'Clouds Midnight', value: 'clouds_midnight', group: 'Dark'},
		{name: 'Cobalt', value: 'cobalt', group: 'Dark'},
		{name: 'Idle Fingers', value: 'idle_fingers', group: 'Dark'},
		{name: 'krTheme', value: 'kr_theme', group: 'Dark'},
		{name: 'Merbivore', value: 'merbivore', group: 'Dark'},
		{name: 'Merbivore Soft', value: 'merbivore_soft', group: 'Dark'},
		{name: 'Mono Industrial', value: 'mono_industrial', group: 'Dark'},
		{name: 'Monokai', value: 'monokai', group: 'Dark'},
		{name: 'Pastel on Dark', value: 'pastel_on_dark', group: 'Dark'},
		{name: 'Solarized Dark', value: 'solarized_dark', group: 'Dark'},
		{name: 'Terminal', value: 'terminal', group: 'Dark'},
		{name: 'Tomorrow Night', value: 'tomorrow_night', group: 'Dark'},
		{name: 'Tomorrow Night Blue', value: 'tomorrow_night_blue', group: 'Dark'},
		{name: 'Tomorrow Night Bright', value: 'tomorrow_night_bright', group: 'Dark'},
		{name: 'Tomorrow Night 80s', value: 'tomorrow_night_eighties', group: 'Dark'},
		{name: 'Twilight', value: 'twilight', group: 'Dark'},
		{name: 'Vibrant Ink', value: 'vibrant_ink', group: 'Dark'}
	];

	o.currentSettings = {
		ace: {
			theme: $filter('filter')(o.aceThemes, {value: $localStorage.get('theme', 'monokai')})[0],
			fontSize: parseInt($localStorage.get('fontSize', 12))
		}
	};

	content.editor.setTheme('ace/theme/' + o.currentSettings.ace.theme.value);
	document.getElementById('editor').style.fontSize = o.currentSettings.ace.fontSize + 'px';

	o.themeChanged = function() {
		content.editor.setTheme('ace/theme/' + o.currentSettings.ace.theme.value);
		$localStorage.set('theme', o.currentSettings.ace.theme.value);
	};

	o.fontSizeChanged = function() {
		document.getElementById('editor').style.fontSize = o.currentSettings.ace.fontSize + 'px';
		$localStorage.set('fontSize', o.currentSettings.ace.fontSize);
	};

	return o;
}]);