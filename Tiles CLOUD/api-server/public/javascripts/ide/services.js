/* Services */

angular.module('tilesIde.services', [])

.factory('appRecipes', ['$http', function($http){
	var o = {
		appRecipes: []
	};

	var escape = function (str) {
  		return str
    	.replace(/[\\]/g, '\\\\')
    	.replace(/[\"]/g, '\\\"')
    	.replace(/[\/]/g, '\\/')
    	.replace(/[\b]/g, '\\b')
    	.replace(/[\f]/g, '\\f')
    	.replace(/[\n]/g, '\\n')
    	.replace(/[\r]/g, '\\r')
    	.replace(/[\t]/g, '\\t');
	};

	o.getAll = function(userId) {
  		return $http.get('/appRecipes/' + userId).then(function(res){
  			angular.copy(res.data, o.appRecipes);
  		});
	}

	o.create = function(userId, appRecipe) {
  		return $http.post('/appRecipes/' + userId, JSON.stringify(appRecipe)).then(function(res){
    		o.appRecipes.push(res.data);
  		});
	}

	o.get = function(userId, appRecipe) {
  		return $http.get('/appRecipes/' + userId + '/' + appRecipe._id).then(function(res){
  			return res.data;
  		});
	}

	o.save = function(userId, appRecipe) {
		var data = {
			code: appRecipe.code,
			group: appRecipe.group
		}
		return $http.put('/appRecipes/' + userId + '/' + appRecipe._id, JSON.stringify(data)).then(function(res){
			console.log('Saved successfully! Data: ' + JSON.stringify(res.data));
		});
	}

	o.delete = function(userId, appRecipe) {
		return $http.delete('/appRecipes/' + userId + '/' + appRecipe._id).then(function(res){
			var index = o.appRecipes.indexOf(appRecipe);
			o.appRecipes.splice(index, 1);
		});
	}

	o.setActive = function(userId, appRecipe, active) {
		return $http.put('/appRecipes/' + userId + '/' + appRecipe._id + '/active', '{"active": ' + active + '}').then(function(res){
			appRecipe.active = active;
			return res.data;
		});
	}

	o.getCode = function(userId, appRecipe, callback) {
  		return $http.get('/appRecipes/' + userId + '/' + appRecipe._id + '/code').then(function(res){
  			callback(res);
  			return res.data;
  		});
	}

	return o;
}])

.factory('tiles', ['$http', function($http){
	var o = {
		tiles: []
	};
	
	o.getAll = function(userId) {
  		return $http.get('/users/' + userId).then(function(res){
  			angular.copy(res.data.tiles, o.tiles);
  		});
	}

	return o;
}])

.factory('content', function(){
	var o = {};
	o.editor = null;

	o.setEditor = function(editor){
		o.editor = editor;
	}
	return o;
})

.factory('mainSidebar', function(){
	var o = {};

	o.selectedAppRecipe = null;

	return o;
})

.factory('controlSidebar', function(){
	var o = {};
	
	o.isOpen = false;
	o.selectedTabIndex = 0;

	o.toggle = function(){
		o.isOpen = !o.isOpen;
	}

	o.open = function(tabIndex){
		o.isOpen = true;
		if (tabIndex !== undefined) o.selectTab(tabIndex);
	}

	o.selectTab = function(tabIndex){
		o.selectedTabIndex	= tabIndex;
	}

	return o;
});