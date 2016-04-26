/* Controllers */

angular.module('tilesIde.controllers', [])

.controller('AppRecipeCtrl', ['$scope', 'userId', 'appRecipes', function($scope, userId, appRecipes){
	var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);

	$scope.user = userId;

	$scope.appRecipes = appRecipes.appRecipes;
	$scope.selectedAppRecipe = null;

	function setAsSelected(appRecipe){
		for (var i=0; i<$scope.appRecipes.length; i++){
			$scope.appRecipes[i].selected = false;
		}
		appRecipe.selected = true;
		$scope.selectedAppRecipe = appRecipe;
	}

	$scope.showAppRecipe = function(appRecipe){
		setAsSelected(appRecipe);
		appRecipes.getCode(userId, appRecipe, function(res){
			var code = res.data;
			editor.setValue(code);
		});
	}

	$scope.createAppRecipe = function(){
		if (!$scope.newAppRecipeName || $scope.newAppRecipeName === '') return;
		appRecipes.create(userId, $scope.newAppRecipeName);
		$scope.newAppRecipeName = '';
	}

	$scope.saveAppRecipe = function(appRecipe){
		appRecipe.code = editor.getValue();
		appRecipes.save(userId, appRecipe);
	}

	$scope.activateApp = function(appRecipe, activate){
		appRecipes.setActive(userId, appRecipe, activate);
	}

	$scope.controlSidebarOpen = false;

	$scope.toggleControlSidebar = function(){
		$scope.controlSidebarOpen = !$scope.controlSidebarOpen;
	}

	$scope.openControlSidebar = function(){
		$scope.controlSidebarOpen = true;
	}
}]);