/* Services */

angular.module('tiles.services', [])

.factory('$localstorage', ['$window', function($window) {
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
    },
    setEventMappings: function(tileId, userId, value) {
    	this.setObject('eventMappings_' + userId + '_' + tileId, value);
    },
    getEventMappings: function(tileId, userId) {
    	return this.getObject('eventMappings_' + userId + '_' + tileId);
    }
  }
}])

.factory('mqttClient', ['$rootScope', '$q', 'tilesApi', function($rootScope, $q, tilesApi){
	var o = {};

	var client;
	var publishOpts = {retain: true};
	var serverConnectionTimeout = 10000; // 10 seconds

	function getDeviceSpecificTopic(device, isEvent){
        var type = isEvent ? 'evt' : 'cmd';
        var group = device.group || 'global';
        return 'tiles/' + type + '/' + tilesApi.username + '/' + group + '/' + device.id;
    }

	o.connect = function(host, port){
		var deferred = $q.defer();
		var failedConnectionTimeout;

		if (client) {
			// End previous server connection
			client.end();
		}

		client = mqtt.connect({
			host: host,
            port: port,
            keepalive: 0
        });

        client.on('connect', function() {
        	clearTimeout(failedConnectionTimeout);
        	deferred.resolve();
		});

		client.on('message', function(topic, message) {
			console.log('Received message from server: ' + message);
	        try {
	            var command = JSON.parse(message);
	            if (command) {
	            	var deviceId = topic.split('/')[4];
	            	$rootScope.$broadcast('command', deviceId, command);
	            	$rootScope.$apply();
	            }
	        } catch (exception) {
	            console.log('Error: ' + exception);
	        }
		});

	    client.on('offline', function() {
	    	$rootScope.$broadcast('offline');
	    	$rootScope.$apply();
	    });

	    client.on('close', function() {
	    	$rootScope.$broadcast('close');
	    	$rootScope.$apply();
	    });

	    client.on('reconnect', function() {
	    	$rootScope.$broadcast('reconnect');
	    	$rootScope.$apply();
	    });

	    client.on('error', function(error) {
	    	$rootScope.$broadcast('error', error);
	    	$rootScope.$apply();
	    });

	    failedConnectionTimeout = setTimeout(function(){
    		client.end();
    		deferred.reject();
	    }, serverConnectionTimeout);

	    return deferred.promise;
	}

	/*o.publish = function(topic, payload, options){
		if (client) client.publish(topic, payload, options);
	}

	o.subscribe = function(topic){
		if (client) client.subscribe(topic);
	}

	o.unsubscribe = function(topic){
		if (client) client.unsubscribe(topic);
	}*/

	o.registerDevice = function(device){
		if (client) {
            client.publish(getDeviceSpecificTopic(device, true) + '/active', 'true', publishOpts);
            client.publish(getDeviceSpecificTopic(device, true) + '/name', device.name, publishOpts);
            client.subscribe(getDeviceSpecificTopic(device, false));
            console.log('Registered device: ' + device.name + ' (' + device.id + ')');
        }
	}

	o.unregisterDevice = function(device){
		if (client) {
            client.publish(getDeviceSpecificTopic(device, true) + '/active', 'false', publishOpts);
            client.unsubscribe(getDeviceSpecificTopic(device, false));
        }
	}

	o.sendEvent = function(device, event){
		if (client) client.publish(getDeviceSpecificTopic(device, true), JSON.stringify(event), publishOpts);
	}

	o.endConnection = function(deviceId, event){
		if (client) client.end();
	}

	return o;
}])

.factory('group', ['$localstorage', 'mqttClient', function($localstorage, mqttClient) {
	var o = {};
	o.setGroup = function(device, group) {
        // Unregister device from previous group
        mqttClient.unregisterDevice(device);

        // Update device's group
        device.group = group;

        // Register device to new group
        mqttClient.registerDevice(device);

        $localstorage.set('group_' + device.id, group);
    };
    return o;
}])

.factory('tilesApi', ['$http', '$localstorage', function($http, $localstorage){
	var o = {
		username: $localstorage.get('username', 'TestUser'),
		host: {
			address: $localstorage.get('hostAddress', 'cloud.tilestoolkit.io'),
			mqttPort: $localstorage.get('mqttPort', 8080),
			apiPort: 3000
		},
		apps: [],
		tiles: {}
	};

	o.addTile = function(device) {
		device.group = $localstorage.get('group_' + device.id, null);
		o.tiles[device.id] = device;
	}

	o.getEventStringAsObject = function(evtString) {
		var params = evtString.split(',');
		var evt = {
			name: params[0],
			properties: Array.prototype.slice.call(params, 1)
		}
		return evt;
	}

	o.getCommandObjectAsString = function(cmdObj){
  		var cmdString = cmdObj.name + ',' + cmdObj.properties.toString();
    	return cmdString;
    }

	var defaultEventMappings = {
		btnON: {
		    type: 'button_event',
		    event: 'pressed'
	    },
	    btnOFF: {
		    type: 'button_event',
		    event: 'released'
	    }
	}

	var eventMappings = {};

	function extend(obj1, obj2){
    	var extended = {};
    	for (var attrname in obj1) { extended[attrname] = obj1[attrname]; }
    	for (var attrname in obj2) { extended[attrname] = obj2[attrname]; }
    	return extended;
	}

	o.setUsername = function(username){
		o.username = username;
		$localstorage.set('username', username);
	}

	o.setHostAddress = function(hostAddress){
		o.host.address = hostAddress;
		$localstorage.set('hostAddress', hostAddress);
	}

	o.setHostMqttPort = function(hostMqttPort){
		o.host.mqttPort = hostMqttPort;
		$localstorage.set('hostMqttPort', hostMqttPort);
	}

	o.getEventMapping = function(tileId, eventAsString) {
		if (eventMappings[o.username] == null || eventMappings[o.username][tileId] == null) {
			o.loadEventMappings(tileId);
		}
		return eventMappings[o.username][tileId][eventAsString];
	}

	o.loadEventMappings = function(tileId) {
		var storedEventMappings = $localstorage.getEventMappings(tileId, o.username);
		if (eventMappings[o.username] == null) eventMappings[o.username] = {};
		eventMappings[o.username][tileId] = extend(defaultEventMappings, storedEventMappings);
	}

	o.fetchEventMappings = function(tileId, successCb) {
		var url = 'http://' + o.host.address + ':' + o.host.apiPort + '/eventmappings/' + o.username + '/' + tileId;
		return $http.get(url).then(function(resp) {
		    var fetchedEventMappings = resp.data;
		    console.log('Success. Fetched data:' + JSON.stringify(fetchedEventMappings));
		    
		    $localstorage.setEventMappings(tileId, o.username, fetchedEventMappings);
		    if (eventMappings[o.username] == null) eventMappings[o.username] = {};
		    eventMappings[o.username][tileId] = extend(defaultEventMappings, fetchedEventMappings);

		    if (successCb) successCb(fetchedEventMappings);
		  }, function(err) {
		    console.error('Error', JSON.stringify(err));
		  });
	}

	o.fetchAppRecipes = function(successCb, failureCb) {
		var url = 'http://' + o.host.address + ':' + o.host.apiPort + '/appRecipes/' + o.username;
		
		return $http.get(url).then(function(resp) {
		    var fetchedAppRecipes = resp.data;
		    o.apps = fetchedAppRecipes;
		    if (successCb) successCb(fetchedAppRecipes);
		}, function(err) {
		    console.error('Error', JSON.stringify(err));
		    if (failureCb) failureCb(err);
		});	
	}

	o.activateApp = function(app, active, successCb, failureCb) {
		var url = 'http://' + o.host.address + ':' + o.host.apiPort + '/appRecipes/' + o.username + '/' + app._id + '/active';
		var data = {
			active: active
		};

		return $http.put(url, data).then(function(resp) {
		    if (successCb) successCb(resp.data);
		}, function(err) {
		    console.error('Error', JSON.stringify(err));
		    if (failureCb) failureCb(err);
		});
	}

	return o;
}]);