var app = angular.module('app', [
  'signup', 
  'renderMap',
  'app.tweets',
  'app.related',
  'app.mapService',
  'app.suggestionsService',
  // 'app.filter',
  'app.search',
  'app.tweetMessageService',
  'ngAnimate', 
  'ui.router',
  'ngMaterial'
])

.config(function ($stateProvider, $urlRouterProvider){

$urlRouterProvider.otherwise("");

// routing stuff
$stateProvider
.state('index', {
      url: "",
      views: {
        'leftDiv': { 
          controller: "tweetsController",
          templateUrl: "client/views/tweetsView.html" 
        },
        'rightDiv': { 
          controller: "relatedController",
          templateUrl: "client/views/relatedView.html" 
        },
        'searchbar': {
          controller: "searchController",
          templateUrl: "client/views/searchView.html"
        }
      }
    });
});
