var mongoose = require('mongoose');

var AppRecipeSchema = new mongoose.Schema({
    name: String,
    active: Boolean,
    group: String,
    user: {type: String, ref: 'User'}
});

mongoose.model('AppRecipe', AppRecipeSchema);