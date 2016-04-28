/* Main module */

angular.module('tilesIde', ['ui.router', 'tilesIde.controllers', 'tilesIde.services'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('ide', {
			url: '/{userId}',
			resolve: {
				userId: ['$stateParams', function($stateParams) {
  					return $stateParams.userId;
				}],
				storedAppRecipesPromise: ['$stateParams', 'appRecipes', function($stateParams, appRecipes) {
  					return appRecipes.getAll($stateParams.userId);
				}]
			},
			views: {
        'header': {
          templateUrl: '/templates/ide.header.html',
          controller: 'HeaderCtrl'
  			},
  			'main-sidebar': {
    			templateUrl: '/templates/ide.main-sidebar.html',
          controller: 'MainSidebarCtrl'
  			},
  			'content': {
    			templateUrl: '/templates/ide.content.html',
          controller: 'ContentCtrl'
  			},
  			'footer': {
    			templateUrl: '/templates/ide.footer.html',
          controller: 'FooterCtrl'
  			},
  			'control-sidebar': {
    			templateUrl: '/templates/ide.control-sidebar.html',
          controller: 'ControlSidebarCtrl'
  			},
        'create-app-modal': {
          templateUrl: '/templates/ide.create-app-modal.html',
          controller: 'CreateAppModalCtrl'
        }
  		}
		});
}]);