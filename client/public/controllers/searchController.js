//searchController.js
angular.module('app.search', [])

.controller('searchController', [
  '$scope', 
  'httpService', 
  'suggestionsService', 
  'mapService',
  'tweetMessageService',
  function ($scope, httpService, suggestionsService, mapService, tweetMessageService) {
    $scope.data = {};
    
    $scope.getMatches = function (partial) {
      return suggestionsService.getHashtagSuggestions(partial)
      .then(function (data) {
        return data.data;
      });
    };

    $scope.submitSearch = function () {
      mapService.clearHeat();
      mapService.deleteMarkers();
      httpService.filterTweets($scope.data.searchText)
        .then(function (result) {
          if (result) {
            tweetMessageService.showRelatedHashtags(mapService.getRelated(result.data))();
          }
        });
      console.log($scope.data.searchText);
      $scope.data.searchText = '';
    };
  }
]);
