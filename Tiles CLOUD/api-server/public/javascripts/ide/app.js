/* Main module */

angular.module('tilesIde', ['ui.router', 'tilesIde.controllers', 'tilesIde.services'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('apps', {
			url: '/{userId}',
			templateUrl: '/templates/appRecipes.html',
			controller: 'AppRecipeCtrl',
			resolve: {
				userId: ['$stateParams', function($stateParams) {
  					return $stateParams.userId;
				}],
				storedAppRecipesPromise: ['$stateParams', 'appRecipes', function($stateParams, appRecipes) {
  					return appRecipes.getAll($stateParams.userId);
				}]
			}
		});
}]);