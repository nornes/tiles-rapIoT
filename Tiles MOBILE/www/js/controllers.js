'use strict';

/* Controllers */

angular.module('tiles.controllers', [])
.controller('MainCtrl', ['$scope', '$ionicPopup', 'mqttClient', 'tilesApi', function($scope, $ionicPopup, mqttClient, tilesApi) {
    $scope.appVersion = '';

    document.addEventListener('deviceready', function () {
        cordova.getAppVersion.getVersionNumber().then(function (version) {
            $scope.appVersion = 'Version ' + version;
        });
    }, false);

    $scope.connectedToServer = false;
    $scope.serverConnectStatusMsg = 'Connect to server';

    $scope.mqttConnectionData = {
        username: tilesApi.username,
        host: tilesApi.host.address,
        port: tilesApi.host.mqttPort
    };

    function setServerConnectionStatus(msg, connected) {
        console.log(msg);
        $scope.serverConnectStatusMsg = msg;
        $scope.connectedToServer = connected;
    }

    // Called when a command is received from the broker
    $scope.$on('command', function(event, deviceId, command) {
        for (var i = 0; i < $scope.devices.length; i++) {
            var device = $scope.devices[i];
            if (device.id == deviceId) {
                device.ledOn = (command.name === 'led' && command.properties[0] === 'on');
                console.log('Device led on: '+device.ledOn);
                $scope.$apply();
                var commandString = tilesApi.getCommandObjectAsString(command);
                $scope.sendData(device, commandString);
            }
        }
    });

    $scope.$on('offline', function() {
        setServerConnectionStatus('Client gone offline', false);
    });

    $scope.$on('close', function() {
        setServerConnectionStatus('Disconnected from server', false);
    });

    $scope.$on('reconnect', function(){
        setServerConnectionStatus('A reconnect is started', false);
    });

    $scope.$on('error', function(event, error){
        setServerConnectionStatus('Error: ' + error, false);
    });

    $scope.showConnectMQTTPopup = function() {
        var serverConnectionPopup = $ionicPopup.show({
            template: 'Username:<input type="text" ng-model="mqttConnectionData.username">Host:<input type="text" ng-model="mqttConnectionData.host">Port:<input type="number" ng-model="mqttConnectionData.port">',
            title: 'Connect to MQTT broker',
            subTitle: 'Enter username, host address and port number',
            scope: $scope,
            buttons: [{
                text: 'Cancel'
            }, {
                text: '<b>Connect</b>',
                type: 'button-positive',
                onTap: function(e) {
                    tilesApi.setUsername($scope.mqttConnectionData.username);
                    tilesApi.setHostAddress($scope.mqttConnectionData.host);
                    tilesApi.setHostMqttPort($scope.mqttConnectionData.port);
                    
                    // Connect to MQTT server/broker
                    mqttClient.connect($scope.mqttConnectionData.host, $scope.mqttConnectionData.port).then(function() {
                        cordova.plugins.backgroundMode.enable();
                        setServerConnectionStatus('Connected to ' + tilesApi.host.address + ':' + tilesApi.host.mqttPort, true);
                        for (var i = 0; i < $scope.devices.length; i++) {
                            var device = $scope.devices[i];
                            if (device.connected) {
                                mqttClient.registerDevice(device);
                            }
                        }
                    }, function() {
                        setServerConnectionStatus('Failed to connect to server', false);
                    });
                    setServerConnectionStatus('Connecting...', false);
                }
            }]
        });
    };
}])
.controller('TilesCtrl', ['$scope', '$ionicPopup', 'mqttClient', 'tilesApi', function($scope, $ionicPopup, mqttClient, tilesApi) {
    $scope.devices = [
        /*{'name': 'TI SensorTag','id': '01:23:45:67:89:AB', 'rssi': -79, 'advertising': null},
        {'name': 'Some OtherDevice', 'id': 'A1:B2:5C:87:2D:36', 'rssi': -52, 'advertising': null , 'connected': true},
        {'name': 'TILES Test Device', 'id': 'A1B2-5C87-2D36-4E57-9GH7-8KL0', 'rssi': -52, 'advertising': null, 'group': 'MyGroup1', 'connected': false}*/
    ];

    var rfduino = {
        serviceUUID: '2220',
        receiveCharacteristic: '2221',
        sendCharacteristic: '2222',
        disconnectCharacteristic: '2223'
    };

    var isNewDevice = function(discoveredDevice) {
        for (var i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id == discoveredDevice.id) return false;
        }
        return true;
    };

    var isTilesDevice = function(discoveredDevice) {
        return discoveredDevice.name != null && discoveredDevice.name.substring(0, 4) === 'TILE';
    };

    $scope.doRefresh = function() {
        // Scan for devices if Bluetooth is enabled.
        // Otherwise, prompt the user to enable Bluetooth.
        ble.isEnabled(
            function() {
                console.log("Bluetooth is enabled");
                ble.scan([], 5, app.onDiscoverDevice, app.onError); // Scan for devices
            },
            function() {
                console.log("Bluetooth is NOT enabled");
                ble.enable(function() {
                    console.log("Bluetooth has been enabled");
                    ble.scan([], 5, app.onDiscoverDevice, app.onError); // Scan for devices
                }, function() {
                    console.log("Bluetooth is still NOT enabled");
                });
            }
        );

        $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.showSetGroupPopup = function(device) {
        $scope.temp = {
            group: device.group || ''
        }
        var setGroupPopup = $ionicPopup.show({
            template: 'Group:<input type="text" ng-model="temp.group">',
            title: 'Group',
            subTitle: 'Enter group name for selected Tile.<br>Leave the field blank for the global channel.',
            scope: $scope,
            buttons: [{
                text: 'Cancel'
            }, {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                    $scope.setGroup(device, $scope.temp.group);
                }
            }]
        });
    };

    $scope.setGroup = function(device, group) {
        // Unregister device from previous group
        mqttClient.unregisterDevice(device);

        // Update device's group
        device.group = group;

        // Register device to new group
        mqttClient.registerDevice(device);
    };

    $scope.connect = function(device) {
        ble.connect(device.id,
            function() {
                device.ledOn = false;
                device.connected = true;
                var receiver = new DataReceiver(device);
                ble.startNotification(device.id, rfduino.serviceUUID, rfduino.receiveCharacteristic, receiver.onData, app.onError);
                $scope.$apply();
                mqttClient.registerDevice(device);
            },
            function() {
                alert('Failure!')
            });
    };

    $scope.disconnect = function(device) {
        ble.disconnect(device.id,
            function() {
                device.connected = false;
                $scope.$apply();
                mqttClient.unregisterDevice(device);
            },
            function() {
                alert('Failure!')
            });
    };

    var arrayBufferToString = function(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    };

    var DataReceiver = function DataReceiver(device) {
        this.onData = function(data) { // Data received from RFduino
            var receivedEventAsString = arrayBufferToString(data);
            console.log('Received event: ' + receivedEventAsString);

            var message = tilesApi.getEventStringAsObject(receivedEventAsString);
            if (message == null) {
                console.log('No mapping found for event: ' + receivedEventAsString + ' from ' + device.id);
            } else {
                if (message.properties[0] === 'touch') {
                    device.buttonPressed = !device.buttonPressed; // Toggle (temporary solution until 'release' event is implemented in TD)
                    $scope.$apply();
                } /*else if (receivedEventAsString === 'btnOFF') {
                    device.buttonPressed = false;
                    $scope.$apply();
                }*/
                console.log('JSON Message to be sent: ' + JSON.stringify(message));

                mqttClient.sendEvent(device, message);
            }
            
        }
    };

    var app = {
        onDiscoverDevice: function(device) {
            console.log('Device discovered: '+device);
            device.connected = false;
            if (isTilesDevice(device) && isNewDevice(device)) {
                $scope.devices.push(device);
            }
        },
        onError: function(reason) {
            alert('ERROR: ' + reason);
        }
    };

    $scope.sendData = function(device, dataString) { // Send data to RFduino
        var success = function() {
            console.log('Data sent successfully.');
        };

        var failure = function() {
            alert('Failed writing data to the RFduino');
        };

        /*var data = new Uint8Array(1);
        data[0] = device.ledOn ? 0x1 : 0x0;*/

        // For sending command from UI (debugging purposes)
        if (dataString === undefined) {
            dataString = device.ledOn ? 'led,on,red' : 'led,off';
        }

        console.log('Sending to device: ' + dataString);

        // Transform string to bytes
        var data = new Uint8Array(dataString.length);
        for (var i = 0, l = dataString.length; i < l; i++) {
            data[i] = dataString.charCodeAt(i);
        }
        console.log('Bytes: ' + data.length);

        ble.writeWithoutResponse(device.id, rfduino.serviceUUID, rfduino.sendCharacteristic, data.buffer, success, failure);
    };
}])
.controller('AppsCtrl', ['$scope', function($scope){
    
}]);