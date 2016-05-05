var mongoose = require('mongoose');
var appRunner = require('../vm_app_runner_bridge');

var AppRecipeSchema = new mongoose.Schema({
    name: String,
    active: Boolean,
    group: String,
    user: {type: String, ref: 'User'}
});

AppRecipeSchema.methods.activate = function(callback) {
    appRunner.activateApp(this, callback);
}

AppRecipeSchema.methods.deactivate = function(callback) {
    appRunner.deactivateApp(this, callback);
}

mongoose.model('AppRecipe', AppRecipeSchema);