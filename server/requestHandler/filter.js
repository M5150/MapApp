var Engine = require('../controllers/engineController');
var HashtagsController = require('../controllers/hashtagsController');

// the filter is an array of hashtags to filter
var filter = {};

// list of tags to ignore
var ignoreTags = {};

// keep track of the current filter because updateFilter will
// be periodically called without a parameter
var currentHashtag = null;
var currentThreshold = 0.05;

var getFilter = function() {
  return Object.keys(filter);
};

// removes a tag from the filter
// needs to keep track of removed tags for when update filter's periodic call
var addIgnoreTag = function(tag) {
  ignoreTags[tag] = tag;
}

// removes tag from ignorelist
var unIgnoreTag = function (tag){
  if(ignoreTags.hasOwnProperty(tag)){
    delete ignoreTags[tag];
  }
}

var getIgnoreTags = function () {
  return Object.keys(ignoreTags);
}

var setHashtag = function(newHashtag){
  // reset the ignore list
  ignoreTags = [];
  currentHashtag = newHashtag;
}

var setThreshold = function(newThreshold){
  currentThreshold = newThreshold;
}

// update the filter with hashtags associated with the hashtag parameter
var updateFilter = function (hashtag, threshold) {
  hashtag = hashtag || currentHashtag;
  threshold = threshold || currentThreshold;

  if (hashtag) {
    // will return array of hashtags from the database
    HashtagsController.getIdForHashtag(hashtag)
      .then(function (hashtagArr) {
        // loop over over all hashtags in the array and pluck the hashtag id's and 
        return hashtagArr.reduce(function (accum, hashtag) {
          // push the new objects to the accumulator
          accum.push({ id: hashtag.id });
          return accum;
        }, [])
      })
      .then(function (hashtagArr) {
        Engine.getRelatedHashtags(hashtagArr)
          .then(function (relatedHashtags) {
            var result = {};

            for (var i = 0; i < relatedHashtags.length; i++) {
              if (relatedHashtags[i].strength >= threshold) {
                var relatedHashtag = {
                  name: relatedHashtags[i].hashtag['name'],
                  strength: relatedHashtags[i]['strength'],
                  count: relatedHashtags[i]['count']
                };
                if (ignoreTags.hasOwnProperty(relatedHashtag)) {
                  // add related hashtag object to result array;
                  result[relatedHashtag] = relatedHashtag;
                }
              }
            }
            filter = result;
          })
        })
  } else if (hashtag === '') {
    filter = {};
  }
  return getFilter();
};

module.exports = {
  getFilter: getFilter,
  updateFilter: updateFilter,
  setHashtag: setHashtag,
  setThreshold: setThreshold,
  addIgnoreTag: addIgnoreTag,
  unIgnoreTag: unIgnoreTag,
  getIgnoreTags: getIgnoreTags,
};
