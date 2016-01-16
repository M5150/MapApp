var Engine = require('../controllers/engineController');
var HashtagsController = require('../controllers/hashtagsController');

// the filter is an array of hashtags to filter
var filter = [];

var getFilter = function(newFilter) {
  if (newFilter) {
    filter = newFilter;
  }
  return filter;
};

// update the filter with hashtags associated with the hashtag parameter
var updateFilter = function (hashtag, threshold) {
  if (hashtag) {
    var threshold = threshold || 0.05;
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
            var result = [];

            for (var i = 0; i < relatedHashtags.length; i++) {
              if (relatedHashtags[i].strength >= threshold) {
                var relatedHashtag = {
                  name: relatedHashtags[i].hashtag['name'],
                  strength: relatedHashtags[i]['strength'],
                  count: relatedHashtags[i]['count']
                };
                // add related hashtag object to result array;
                result.push(relatedHashtag);
              }
            }
            getFilter(result);
            return result;
          })
        })
  } else if (hashtag = '') {
    filter = [];
  } else {
    return getFilter();
  }
};

module.exports = {
  getFilter: getFilter,
  updateFilter: updateFilter
};
