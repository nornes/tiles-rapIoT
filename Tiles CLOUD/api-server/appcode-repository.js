var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

function getAppPath(appId, userId, fullPath) {
	var appDir = __dirname + '/apps/' + userId + "/" + appId;
	return fullPath ? appDir + '/app.js' : appDir;
}

exports.create = function(appId, userId, code) {
    var dir = getAppPath(appId, userId, false);
    mkdirp(dir, function(err) {
        if (err) console.log('Error: ' + err);
        else console.log('Directory created: ' + dir);

        var file = getAppPath(appId, userId, true);
        fs.writeFile(file, code, function(err) {
            if (err) console.log(err);
            console.log('File created: ' + file);
        });
    });
};

exports.update = function(appId, userId, code) {
	var file = getAppPath(appId, userId, true);
    fs.writeFile(file, code, function(err) {
        if (err) console.log(err);
        console.log('File saved: ' + file);
    });
};

exports.read = function(appId, userId, callback) {
	var file = getAppPath(appId, userId, true);
	fs.readFile(file, 'utf8', callback);
};