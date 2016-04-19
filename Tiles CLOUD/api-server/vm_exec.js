const vm = require('vm');
const TilesClient = require('../../Tiles\ CLIENTS/js/tiles-client.js');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tiles-api');
require('./models/AppRecipes');
const AppRecipe = mongoose.model('AppRecipe');

var id = process.argv[2];

AppRecipe.findById(id, function(err, appRecipe) {
	if (err) console.log('Could not find app recipe with ID: ' + id);
	else {
		var code = appRecipe.code;
		var options = {};
		const sandbox = {
			TilesClient: TilesClient
		};
		var script = new vm.Script(code, options);
		script.runInNewContext(sandbox);
	}
});