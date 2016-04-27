/* Controllers */

angular.module('tilesIde.controllers', [])

.controller('ContentCtrl', ['$scope', 'userId', 'appRecipes', 'content', 'mainSidebar', function($scope, userId, appRecipes, content, mainSidebar){
	var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    content.setEditor(editor);

    $scope.msb  = mainSidebar;

	$scope.saveAppRecipe = function(appRecipe){
		appRecipe.code = content.editor.getValue();
		appRecipes.save(userId, appRecipe);
	}

	$scope.activateApp = function(appRecipe, activate){
		appRecipes.setActive(userId, appRecipe, activate);
	}
}])
.controller('MainSidebarCtrl', ['$scope', 'userId', 'appRecipes', 'mainSidebar', 'content', function($scope, userId, appRecipes, mainSidebar, content){
	$scope.appRecipes = appRecipes.appRecipes;

	function setAsSelected(appRecipe){
		for (var i=0; i<$scope.appRecipes.length; i++){
			$scope.appRecipes[i].selected = false;
		}
		appRecipe.selected = true;
		mainSidebar.selectedAppRecipe = appRecipe;
	}

	$scope.showAppRecipe = function(appRecipe){
		setAsSelected(appRecipe);
		appRecipes.getCode(userId, appRecipe, function(res){
			var code = res.data;
			content.editor.setValue(code);
		});
	}

	$scope.createAppRecipe = function(){
		if (!$scope.newAppRecipeName || $scope.newAppRecipeName === '') return;
		appRecipes.create(userId, $scope.newAppRecipeName);
		$scope.newAppRecipeName = '';
	}
}])
.controller('ControlSidebarCtrl', ['$scope', 'controlSidebar', function($scope, controlSidebar){
	$scope.controlSidebar = controlSidebar;
}])
.controller('HeaderCtrl', ['$scope', 'controlSidebar', function($scope, controlSidebar){
	$scope.controlSidebar = controlSidebar;
}])
.controller('FooterCtrl', ['$scope', function($scope){

}]);