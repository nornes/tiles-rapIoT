const WHITELISTED_MODULES = ['http', 'https', 'websocket'];

module.exports = function(module) {
	if (WHITELISTED_MODULES.includes(module)) {
		return require(module);
	} else {
		console.warn(module + ': Required module is not available.');
	}
}