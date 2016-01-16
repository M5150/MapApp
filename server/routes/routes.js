// Setup dependences
var express = require('express');
var router = express.Router();
var path = require('path');
var UserController = require('../controllers/userController');
var hashtagsController = require('../controllers/hashtagsController');
var passport = require('passport');
var socketService = require('../service/socketService');
var filterService = require('../requestHandler/filter');


var isLoggedIn = function (req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }

  // if they aren't redirect them to the home page
  res.redirect('/signup');
};

/* GET Request for index page. */
router.get('/', isLoggedIn, function (req, res, next) {
  res.sendFile(path.join(__dirname, '../../client/views/index.html'));
});

//-----------------------   Auth  --------------------------
// Login Route for O-Auth
router.get('/auth/twitter', passport.authenticate('twitter'));

// Login Callback From Twitters O-Auth
router.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/auth/twitter' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

// Logout Route
router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/signup');
});

router.get('/signup', function (req, res) {
  res.sendFile(path.join(__dirname, '../../client/views/signup.html'));
});

//------------------------ REST API --------------------------
// Handle GET request to Twitter API
// router.get('/api/tweets/:category', twitterApiController.getTweets);
// Handle PUT request to /api/users (to change favorites)
router.put('/api/users/:username', function (req, res) {
  console.log('Recevied PUT request from client', req.body);
  var favoritesHashtags = req.body.favoritesHashtags;
  UserController.addFavorite(req.params.username, favoritesHashtags, function (response) {
    console.log('Successfully updated favorite hashtags');
    res.sendStatus(200);
  });
});

// change the hashtag filter
router.post('/api/hashtag', function (req, res) {
  var hashtag = req.body.hashtag;
  filterService.setHashtag(hashtag);
  filterService.updateFilter();
  res.json(filterService.getFilter());
});

// get hashtag suggestions for auto complete feature
router.param('tag', function (req, res, next, tag){
  req.param.tag = tag;
  next();
});

router.get('/api/hashtag/:tag', function (req, res, next){
  hashtagsController.completeHashtag(req.param.tag)
  .then(function (suggestions) {
    res.json(suggestions);  
  })
});

// Ignore list is a list of tags to remove from the filter
// add a tag to the ignore list.
router.post('/api/ignore/:tag', function (req, res, next) {
  filterService.addIgnoreTag(req.param.tag);
  res.json(filterService.getIgnoreTags());
});

// remove a tag from the ignore list
router.delete('/api/ignore/:tag', function (req, res, next) {
  filterService.unIgnoreTag(req.param.tag);
  res.json(filterService.getIgnoreTags());
});

// get ignore list
router.get('/api/ignore', function (req, res, next) {
  res.json(filterService.getIgnoreTags());
});

module.exports = router;
