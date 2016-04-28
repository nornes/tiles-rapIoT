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
}])
.controller('ControlSidebarCtrl', ['$scope', 'controlSidebar', function($scope, controlSidebar){
	$scope.controlSidebar = controlSidebar;
}])
.controller('HeaderCtrl', ['$scope', 'controlSidebar', function($scope, controlSidebar){
	$scope.controlSidebar = controlSidebar;
}])
.controller('FooterCtrl', ['$scope', function($scope){

}])
.controller('CreateAppModalCtrl', ['$scope', 'userId', 'appRecipes', function($scope, userId, appRecipes){
	var defaults = {
		name: '',
		programmingLanguage: 'JavaScript',
		templateName: 'Standard',
		template: {
			connectToServer: true,
			setTargetGroup: true,
			evtConnectedToServer: true,
			evtMsgReceived: true,
			evtDeviceConnected: true,
			evtDeviceDisconnected: true
		}
	}

	// Clone the 'defaults' object to provide a mutable object for the view
	$scope.newAppRecipe = JSON.parse(JSON.stringify(defaults));

	$scope.createAppRecipe = function(){
		if (!$scope.newAppRecipe.name || $scope.newAppRecipe.name === '') return;

		// Hide modal
		$('#createAppModal').modal('hide');

		// Create app
		appRecipes.create(userId, $scope.newAppRecipe);

		// Reset form by cloning 'defaults' object
		$scope.newAppRecipe = JSON.parse(JSON.stringify(defaults));
	}

	$scope.templateSelectionChanged = function(){
		// Uncheck all sections initially
		$scope.newAppRecipe.template.connectToServer = false;
		$scope.newAppRecipe.template.evtMsgReceived = false;
		$scope.newAppRecipe.template.setTargetGroup = false;
		$scope.newAppRecipe.template.evtConnectedToServer = false;
		$scope.newAppRecipe.template.evtDeviceConnected = false;
		$scope.newAppRecipe.template.evtDeviceDisconnected = false;

		// Check sections to be included
		switch ($scope.newAppRecipe.templateName) {
			case 'Custom':
			case 'Standard':
				$scope.newAppRecipe.template.connectToServer = true;
				$scope.newAppRecipe.template.evtMsgReceived = true;
				$scope.newAppRecipe.template.setTargetGroup = true;
				$scope.newAppRecipe.template.evtConnectedToServer = true;
				$scope.newAppRecipe.template.evtDeviceConnected = true;
				$scope.newAppRecipe.template.evtDeviceDisconnected = true;
				break;
			case 'Minimal':
				$scope.newAppRecipe.template.connectToServer = true;
				$scope.newAppRecipe.template.evtMsgReceived = true;
				break;
		} 
	}

	$scope.templateSectionsChanged = function(){
		// Set template name to custom if a template section checkbox is modified by user
		$scope.newAppRecipe.templateName = 'Custom';
	}
}]);