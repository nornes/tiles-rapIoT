/* Main module */

angular.module('tilesApi', ['ui.router', 'tilesApi.controllers', 'tilesApi.services'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('main', {
			url: '',
			templateUrl: '/templates/main.html'
		})
		.state('main.users', {
			url: '/users',
			templateUrl: '/templates/main.users.html',
			controller: 'UsersCtrl',
			resolve: {
				userPromise: ['users', function(users){
					return users.getAll();
				}]
			}
		})
		.state('main.user', {
			url: '/users/{id}',
			templateUrl: '/templates/main.user.html',
			controller: 'UserCtrl',
			resolve: {
				user: ['$stateParams', 'users', function($stateParams, users) {
  					return users.get($stateParams.id);
				}]
			}
		})
		.state('main.tile', {
			url: '/users/{userId}/{tileId}',
			templateUrl: '/templates/main.tile.html',
			controller: 'TileCtrl',
			resolve: {
				userId: ['$stateParams', function($stateParams) {
  					return $stateParams.userId;
				}],
				tileId: ['$stateParams', function($stateParams) {
  					return $stateParams.tileId;
				}],
				tile: ['$stateParams', 'tiles', function($stateParams, tiles) {
  					return tiles.get($stateParams.userId, $stateParams.tileId);
				}],
				registeredWebhooksPromise: ['$stateParams', 'webhooks', function($stateParams, webhooks) {
  					return webhooks.getRegistered($stateParams.userId, $stateParams.tileId);
				}]
			}
		});

	$urlRouterProvider.otherwise('users');
}]);