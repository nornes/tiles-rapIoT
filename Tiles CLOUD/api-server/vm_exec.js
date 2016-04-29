const vm = require('vm');
const util = require('util');
const appRepository = require('./appcode-repository.js');
const TilesClient = require('../../Tiles\ CLIENTS/js/tiles-client.js');

var appId = process.argv[2];
var userId = process.argv[3];
var group = process.argv[4];

appRepository.read(appId, userId, function(err, data) {
	if (err) throw err;

	var code = data;
	var config = appRepository.getConfigModule(appId, userId);
	config.group = group;

	var options = {};
	var sandbox = {
		TilesClient: TilesClient,
		appConfig: config
	};

	console.log('Sandbox: ' + util.inspect(sandbox));

	var script = new vm.Script(code, options);
	script.runInNewContext(sandbox);
});
