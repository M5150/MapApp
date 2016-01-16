angular.module('app.related', [])
.controller('relatedController', [
  '$scope',
  'tweetMessageService',
  function ($scope, tweetMessageService) {
    $scope.data = {};
    $scope.data.show = false;

    var showRelated = function(hashtags) {
      $scope.data.relatedHashtags = hashtags;
    };

    var slide = function(){  
    if (! $scope.data.show){
      $( ".hash-filters" ).animate({
          direction: 'right',
          width: 0,
          "margin-right": "-15px"
      }, 1000, function() {
        // Animation complete.
      });
    }else{
      $( ".hash-filters" ).animate({
          direction: 'right',
          width: "150px",
          "margin-right": "5px"

      }, 1000, function() {
        // Animation complete.
      });
    }
    };

    $scope.toggleHashList = function () {
      $scope.data.show = !$scope.data.show;
      slide();
    };

    tweetMessageService.addListener(showRelated, 'showRelated');
  }
]);
