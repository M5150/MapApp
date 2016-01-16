//tweetMessageService.js
angular.module('app.tweetMessageService', [])

.factory('tweetMessageService', function () {
  var listener = {};

  return {
    addListener: function (callback, name) {
      listener[name] = callback;
    },

    showMessageCallback: function (message) {
      return function () {
        // var myMessage = message; // attempt to speed up displaying the message
        listener['showMessage'](message);
      }
    },

    showRelatedHashtags: function (hashtags) {
      return function() {
        console.log(hashtags);
        listener['showRelated'](hashtags);
      }
    },
  };
});
