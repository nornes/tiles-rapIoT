const rl = require('readline');

rl.Interface.prototype.prompt = function(){
	this._writeToOutput(this._prompt + '[Ready for input]\n');
}

module.exports.createInterface = function(process) {
	return rl.createInterface({input: process.stdin, output: process.stdout, terminal: false});
}