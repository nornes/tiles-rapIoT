var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var _getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

var getAppPath = function(appId, userId) {
	return _getUserHome() + '/tilesapps/' + userId + '/' + appId;
};

var writeFile = function(path, filename, data) {
    var file = path + '/' + filename;
    fs.writeFile(file, data, function(err) {
        if (err) console.log(err);
        else console.log('File created: ' + file);
    });
};

var _invalidateRequireCacheForFile = function(filePath) {
    delete require.cache[path.resolve(filePath)];
};

var requireNoCache =  function(filePath) {
    _invalidateRequireCacheForFile(filePath);
    return require(filePath);
};

exports.create = function(appId, userId, code, config) {
    var dir = getAppPath(appId, userId);
    mkdirp(dir, function(err) {
        if (err) console.log('Error: ' + err);
        else console.log('Directory created: ' + dir);

        if (code) writeFile(dir, 'app.js', code);
        if (config) writeFile(dir, 'config.json', JSON.stringify(config, null, 2));
    });
};

exports.update = function(appId, userId, code, config) {
    var dir = getAppPath(appId, userId);
    
    if (code) writeFile(dir, 'app.js', code);
    if (config) writeFile(dir, 'config.json', JSON.stringify(config, null, 2));
};

exports.read = function(appId, userId, callback) {
	var appFile = getAppPath(appId, userId) + '/app.js';
	fs.readFile(appFile, 'utf8', callback);
};

exports.getConfigModule = function(appId, userId) {
    var configFile = getAppPath(appId, userId) + '/config.json';
    return requireNoCache(configFile);
};

exports.delete = function(appId, userId, callback) {
    var path = getAppPath(appId, userId);
    var options = {};
    rimraf(path, options, callback);
}