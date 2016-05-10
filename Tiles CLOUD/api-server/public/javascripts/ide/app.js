/* Main module */

angular.module('tilesIde', ['ui.router', 'JSONedit', 'tilesIde.controllers', 'tilesIde.services'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('ide', {
			url: '/ide/{userId}',
			resolve: {
				userId: ['$stateParams', function($stateParams) {
  					return $stateParams.userId;
				}],
				storedAppRecipesPromise: ['$stateParams', 'appRecipes', function($stateParams, appRecipes) {
  					return appRecipes.getAll($stateParams.userId);
				}],
        storedTilesPromise: ['$stateParams', 'tiles', function($stateParams, tiles) {
            return tiles.getAll($stateParams.userId);
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
        },
        'tile-console-modal': {
          templateUrl: '/templates/ide.tile-console-modal.html',
          controller: 'TileConsoleModalCtrl'
        },
        'config-editor-modal': {
          templateUrl: '/templates/ide.config-editor-modal.html',
          controller: 'ConfigEditorModalCtrl'
        },
        'confirm-app-delete-modal': {
          templateUrl: '/templates/ide.confirm-app-delete-modal.html',
          controller: 'ConfirmAppDeleteModalCtrl'
        }
  		}
		})
  .state('login', {
    url: '/login',  
    templateUrl: '/templates/login.html',
    controller: 'LoginCtrl'
  });

  $urlRouterProvider.otherwise('/login');

}]);