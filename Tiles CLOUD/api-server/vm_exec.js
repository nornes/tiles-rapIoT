const vm = require('vm');
const appRepository = require('./appcode-repository.js');
const TilesClient = require('../../Tiles\ CLIENTS/js/tiles-client.js');

var appId = process.argv[2];
var userId = process.argv[3];

appRepository.read(appId, userId, function(err, data) {
	if (err) throw err;

	var code = data;
	var options = {};
	var sandbox = {
		TilesClient: TilesClient
	};

	var script = new vm.Script(code, options);
	script.runInNewContext(sandbox);
});
