angular.module('app.mapService', [])

.factory('mapService', [
  'tweetMessageService',
  '$http', 
  'httpService', 
  '$sce', 
  '$timeout', 
  function (tweetMessageService, $http, httpService, $sce, $timeout) {
    //////////////////////////////////////////MAPS PAGE CONTROLLER DRIVER//////////////////////////////////////////////

    //create array that will contain data for ALL incoming tweets
    var allTweets = {
      data: []
    };

    //create array that will contain data for ONLY quality/relevant tweets
    var relevantTweets = [];

    var setMapOnAll = function (map) {
      for (var i = 0; i < allTweets.data.length; i++) {
        allTweets.data[i].setMap(map);
      }
    };

    var clearMarkers = function () {
      setMapOnAll(null);
    };

    var deleteMarkers = function () {
      clearMarkers();
      allTweets.data = [];
    };
    ////////////////////////////////////////////CREATE AND OPEN SOCKET/////////////////////////////////////////////////////////
    
    var HEATmap;

    var onInit = function () {    
    ////////////////////////////////ASSUMPTIONS + DRIVERS FOR HANDLING DATA STREAM///////////////////////////////////////////
    
    //establish map drivers
    var maxNumOfTweetsAllowedOnMap = 10000;
    var heatmap = new google.maps.visualization.HeatmapLayer({
      radius: 15
    });
    HEATmap = heatmap;
  
    //establish tweet relevancy criteria; 
    var numOfFollowersToBeRelevant = 10000;
    var numOfRetweetsToBeRelevant = 50; 
    var maxNumOfRelevantTweetsAllowed = 15;

    //////////////////////////////////////////SET UP HEAT MAP///////////////////////////////////////////////////
    $timeout(function () {
      heatmap.setMap(window.map);
    }, 10);
 
    //////////////////////////////////////////CONNECT TO SOCKET///////////////////////////////////////////////
    if (io !== undefined) {
      //connects to socket
      var socket = io.connect();
      //uses socket to listen for incoming tweet stream 
      var count = 0;
      socket.on('tweet-stream', function (data) {
        if(allTweets.data.length > maxNumOfTweetsAllowedOnMap){
          var pinToRemove = allTweets.data.shift();
          pinToRemove.setMap(null);
        }
        ///////////////////////////////////DETERMINE RELEVANCE/QUALITY OF TWEET//////////////////////////////////
        //set relevant parameters
        var numOfFollowers = data.followers_count;
        var numOfRetweets = data.retweet_count;
        var verifiedAccount = data.verified;
        var tweetObject = {};
        //if incoming tweet meets relevancy criteria...
        if ((numOfFollowers >= numOfFollowersToBeRelevant) || (numOfRetweets >= numOfRetweetsToBeRelevant)) {
          //then check to see how many relevant tweets are already being displayed on page; if max limit 
          //has already been reached then pop last item out of relevantsTweets array
          if (relevantTweets.length === maxNumOfRelevantTweetsAllowed) {
            relevantTweets.pop();
          }
          //for all incoming tweets that match criteria, create a tweetObject that contains most relevant info for tweet
          //(e.g. handle, content, and time);         
          tweetObject = {
            handle: data.handle,
            text: data.tweetText,
            time: data.tweetTime
          };
        }

        ///////////////////////////////////PLACE ALL INCOMING TWEETS ON MAP///////////////////////////////////////
        var tweetLocation = new google.maps.LatLng(data["coordinates"][1], data["coordinates"][0]);
                
        heatmap.data.push(tweetLocation);
        
        var tweetMarker = new google.maps.Marker({
           icon: "client/assets/pin.png",
           position: tweetLocation,
           map: window.map
         });

        //determine content added to info window on each marker  
        var tweetContent = {};
        tweetContent.name = data['name'];
        tweetContent.tweetText = data['tweetText'];
        tweetContent.url = data['url'];
        tweetContent.image = data['profileImage'];
        tweetContent.strength = data['strength'];
        tweetContent.profileUrl = 'http://www.twitter.com/' + data['name'];
        tweetMarker.addListener('click', tweetMessageService.showMessageCallback(tweetContent));

        // //set tweet on map...
        tweetMarker.setMap(window.map, tweetLocation, tweetContent);
        allTweets.data.push(tweetMarker);
        google.maps.event.addListener(window.map, "zoom_changed", function () {
          HEATmap.setOptions({
            radius: window.map.getZoom() * 8,
            dissipating: true
          });
        });
      })

      socket.on('connected', function (r) {
        console.log('connected client');
        socket.emit('tweet flow');
      })
    };
  };

  var getRelated = function (related) {
    return related.sort(function (a, b) {
      return a.strength - b.strength;
    }).slice(0, 10);
  };

  var clearHeat = function () {
    HEATmap.setMap(null);
    HEATmap.setData([])
    HEATmap.setMap(window.map)
  }

  return {
    onInit: onInit,
    allTweets: allTweets,
    relevantTweets: relevantTweets,
    clearMarkers: clearMarkers,
    deleteMarkers:deleteMarkers,
    setMapOnAll: setMapOnAll,
    clearHeat:clearHeat,
    getRelated: getRelated
  }
}
]);
