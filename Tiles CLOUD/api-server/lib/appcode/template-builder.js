exports.build = function(userId, templateSections) {
    var code = '';
    if (templateSections.connectToServer) {
        code += 'var client = new TilesClient(\'' + userId + '\'';

        if (templateSections.setTargetGroup) {
            code += ', appConfig.group';
        }

        code += ').connect();';

        if (templateSections.evtConnectedToServer) {
            code += '\r\n\r\nclient.on(\'connect\', function() {\r\n    \r\n});';
        }

        if (templateSections.evtMsgReceived) {
            code += '\r\n\r\nclient.on(\'receive\', function(tileId, event) {\r\n    \r\n});'
        }

        if (templateSections.evtDeviceConnected) {
            code += '\r\n\r\nclient.on(\'tileRegistered\', function(tileId) {\r\n    \r\n});'
        }

        if (templateSections.evtDeviceDisconnected) {
            code += '\r\n\r\nclient.on(\'tileUnregistered\', function(tileId) {\r\n    \r\n});';
        }
    }
    return code;
};