var model = require('../db/dbModel.js');
var Promise = require('bluebird');

var hashtagList;

var setHashtagArray = function (hashtagArray) {
  if (!!hashtagArray) {  
    hashtagList = hashtagArray;
  }

  return hashtagList;  
};

/*
  The heart of the project...
  The order of operations is as follows:
  1) Find all users associated with item
  2) Find all items associated with users
  3) Add all items to the data object and increment counts associated with items
  4) Calculate resulting strength of association (count / maxCount)
  5) Return array of objects consisting of {id: item.id, name: item.name, strength: (calculated strength) }

  inputs:
   array of:
     { id: xx, .... }

  outputs:
   array of:
     { item: { associated item object }, strength: 0.000 - 1.000, count: 123 }
*/
var getRelatedHashtags = function (hashtagList) {
  console.log('hashtag list:', hashtagList);
  // max count for calculating relational strength
  var maxCount = 0;
  var hashtagCounts = {};

  // translate hashtagList into object for fast referencing
  var hashtagIds = [];
  for (var i = 0; i < hashtagList.length; i++) {
    hashtagIds.push(hashtagList[i].id);
  };

  // find all occurances of hashtagIds in item table
  return model.Hashtag.findAll({ 
    where: {
      id: hashtagIds
    },
    include: [ model.User ]
  })
  // expected input to be array of { hashtags } to the .then block
  .then(function (hashtags) {
    console.log('hashtags: ', hashtags);
    return hashtags.reduce(function (accum, record) {
      record.Users.forEach(function(hashtag) {
        accum.push(hashtag.id);
      })
      return accum;
    }, []);
  })
  .each(function(user) {
    return model.User.findAll({
      where: {
        id: user
      },
      include: [ model.Hashtag ]
    })
    .then(function (hashtagUsersRecords) {
      // find each item that this member 'likes'
      return hashtagUsersRecords.forEach(function (recordsArr) {
        recordsArr.Hashtags.forEach(function (record) {
          // deletes unnecessary data from item object
          delete record.dataValues.hashtag_user;

          // check if hashtag id exists in hashtagCounts object
          if (!!hashtagCounts[record.id]) {
            hashtagCounts[record.id].count++;
          } else {
            // if it does not exist, create it
            hashtagCounts[record.id] = {};
            hashtagCounts[record.id].hashtag = record.dataValues;
            hashtagCounts[record.id].count = 1;
            hashtagCounts[record.id].strength = 0;
          }
          // if the count for this hashtag is larger than the max count
          if (hashtagCounts[record.id].count > maxCount) {
            // set the max count to the count of the current hashtag
            maxCount = hashtagCounts[record.id].count;
          }
        })
      });
    })
  })
  .then(function () {
    var results = [];

    // calculate strength based on max count and the count of each hashtag
    for (var hashtag in hashtagCounts) {
      hashtagCounts[hashtag].strength = hashtagCounts[hashtag].count / maxCount;
      results.push(hashtagCounts[hashtag]);
    }
    
    setHashtagArray(results);
    console.log('!!!!!!!results: ', results);
    return results;
  })
};

module.exports = {
  getRelatedHashtags: getRelatedHashtags,
  setHashtagArray: setHashtagArray
};
