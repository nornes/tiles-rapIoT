exports.build = function(userId, templateSections) {
    var code = '';
    if (templateSections.connectToServer) {
        code += 'var client = new TilesClient(\'' + userId + '\'';

        if (templateSections.setTargetGroup) {
            code += ', appConfig.group';
        }

        code += ', \'localhost\').connect();';

        if (templateSections.evtConnectedToServer) {
            code += '\r\n\r\nclient.on(\'connect\', function() {\r\n    // App is connected to server\r\n});';
        }

        if (templateSections.evtMsgReceived) {
            code += '\r\n\r\nclient.on(\'receive\', function(tileId, event) {\r\n    // An event is received from a Tile\r\n});'
        }

        if (templateSections.evtDeviceConnected) {
            code += '\r\n\r\nclient.on(\'tileRegistered\', function(tileId) {\r\n    // A Tile is registered (connected)\r\n});'
        }

        if (templateSections.evtDeviceDisconnected) {
            code += '\r\n\r\nclient.on(\'tileUnregistered\', function(tileId) {\r\n    // A Tile is unregistered (disconnected)\r\n});';
        }
    }
    return code;
};