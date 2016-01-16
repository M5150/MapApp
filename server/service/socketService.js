var textSearch = require('../utils/textSearch');
var TwitterAPI = require('../controllers/twitterApiController');
var filterService = require('../requestHandler/filter');
var socketio = require('socket.io');
var hashtagsController = require('../controllers/hashtagsController');
var hashtag = null;

var filterHashtag = function (newHashtag) {
  if (newHashtag) {
    hashtag = newHashtag;
    filterService.updateFilter(hashtag);
  }
  return hashtag;
};

var connect = function (server) {
  var io = socketio.listen(server);
  var count = 0;

  // Create web socket connection
  io.sockets.on('connection', function (socket) {
    socket.on('tweet flow', function () {

      var connection = null;

      if (connection === null) {
        connection = true;
        console.log('connected');

        var twitterTopic = filterHashtag();

        TwitterAPI.streamTweets(twitterTopic, function (data) {
          if (data.user.geo_enabled) {
            if (data.coordinates !== null || data.place !== null) {
              var tweetObject = data;
              var topicExists;
              var hashTagExists;

              count++;
              var scrubbedTweetObject = {
                name: tweetObject.user['name'],
                handle: tweetObject.user['screen_name'],
                // verified: tweetObject.user['verified'],
                createdAt: tweetObject.user['created_at'],
                description: tweetObject.user['description'],
                url: tweetObject.user['url'],
                hashtags: tweetObject.entities['hashtags'],
                followers_count: tweetObject.user['followers_count'],
                coordinates: tweetObject['coordinates'] ? tweetObject['coordinates']['coordinates'] : tweetObject['place']['bounding_box']['coordinates'][0][0],
                geo: tweetObject['geo'],
                place: tweetObject['place'],
                tweetText: tweetObject['text'],
                tweetTime: tweetObject['created_at'],
                profileImage: tweetObject['user']['profile_image_url'],
                // retweet_count: tweetObject['retweet_count'],
                // favorite_count: tweetObject['favorite_count']
              };

              var databaseTweet = {
                name: scrubbedTweetObject.handle,
                hashtags: scrubbedTweetObject.hashtags
              };

              // if scrubbed tweet object has any hashtags
              if (scrubbedTweetObject.hashtags.length > 0) {
                hashtagsController.addHashtag(databaseTweet)
                  .then(function () {
                    if (count > 1000) {
                      count = 0;
                      // returned object will be of the following format...
                        // { name: 'abc', strength: .02923, count: 1234 }
                      return filterService.updateFilter();
                    } else {
                      // filter should be an array
                      // console.log('filter service filter variable: ',filterService.getFilter())
                      return filterService.getFilter();
                    }
                  })
                  .then(function (filter) {
                    // console.log('inside socket service filter promise: ', filter);
                    if (filter.length > 0) {
                      // for each hash tag in filter
                      for (var i = 0; i < filter.length; i++) {
                        // check if the tweet has the filter hashtag
                        // itterate over tweet's hashtag array
                        for (var j = 0; j < scrubbedTweetObject.hashtags.length; j++) {
                          // console.log('filter: ', filter[i], ', tweet hashtags: ', scrubbedTweetObject.hashtags);
                          // console.log('hashtags in this message: ', scrubbedTweetObject.hashtags[j].text)
                          if (filter[i].name.toUpperCase() == scrubbedTweetObject.hashtags[j].text.toUpperCase()) {
                            // attach strength rating, count, and 'related' hashtag to scrubbed tweet object passed to client
                            scrubbedTweetObject['strength'] = filter[i]['strength'];
                            scrubbedTweetObject['count'] = filter[i]['count'];
                            scrubbedTweetObject['relatedHashtag'] = filter[i]['name'];

                            console.log('filter passed, tweet being passed to client: ', scrubbedTweetObject)
                            return scrubbedTweetObject;
                          }
                        }
                      }
                      throw(new Error('Item does not contain filter hashtags'));
                    } else {
                      return scrubbedTweetObject;
                    }
                  })
                  .then(function (tweets) {
                    socket.broadcast.emit("tweet-stream", scrubbedTweetObject);
                    socket.emit("tweet-stream", scrubbedTweetObject);
                  })
                  .catch(function (err) {
                    // console.log('error!!!', err);
                  })
                } else {
                  // console.log('no hashtags!')
                }
            }
          }
        });
      }
    });
    socket.on("disconnect", function () {
      console.log('disconnected');
    });
    socket.emit("connected");
  });
};

// throw dummy data into database
// var dummy = function () {

//   var databaseTweet = {
//     name: "Alex",
//     hashtags: ['winning', 'obama', 'losing'],
//   };

//   hashtagsController.addHashtag(databaseTweet)
//     // filter should be an array
// }
// dummy();

module.exports = {
  connect: connect,
  filterHashtag: filterHashtag
};