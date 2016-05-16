var shell = require('shelljs');
var fs = require('fs');

const DOKKU_HOST = '129.241.102.154';

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getAppPath(appId, userId) {
	return getUserHome() + '/tilesapps/' + userId + '/' + appId;
}

function createDokkuRemoteCmd(cmd) {
    return 'ssh dokku@' + DOKKU_HOST + ' ' + cmd;
}

function setupPackageJson(appId, userId) {
    var packageJsonFile = getAppPath(appId, userId) + '/package.json';
    var packageJson = require(packageJsonFile);
    packageJson.scripts = {start: 'node app.js'};
    packageJson.dependencies = {express: '^4.13.4'};
    
    var data = JSON.stringify(packageJson, null, 2);
    fs.writeFileSync(packageJsonFile, data);
}

var dokkuBridge = {
    init: function(appId, userId){
        var appName = 'app_' + appId;
        shell.cd(getAppPath(appId, userId));
        shell.exec(createDokkuRemoteCmd('apps:create ' + appName));
        shell.exec('npm init -f');
        setupPackageJson(appId, userId);
        shell.exec('git init');
        shell.exec('git remote add dokku dokku@' + DOKKU_HOST + ':' + appName);
        shell.exec('git add -A');
        shell.exec('git commit -m "Initial commit"');
    },

    commit: function(appId, userId){
        shell.cd(getAppPath(appId, userId));
        shell.exec('git add -A');
        shell.exec('git commit -m "Update"');
    },

    deploy: function(appId, userId){
        shell.cd(getAppPath(appId, userId));
        shell.exec('git add -A');
        shell.exec('git commit -m "Update"');
        shell.exec('git push dokku master');
    },

    destroy: function(appId, userId){
        var appName = 'app_' + appId;
        shell.exec(createDokkuRemoteCmd('-- --force apps:destroy ' + appName));
    }
}

module.exports = dokkuBridge;