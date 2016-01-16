// Setup server dependencies
var express = require('express');
var path = require('path');
var favicon = require('express-favicon');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require("passport");
var session = require('express-session');
var routes = require('./routes/routes');
var socketService = require('./service/socketService');
var db = require('./db/dbModel');

// **Important password and keys **
if (!process.env.CONSUMER_KEY) {
  var KEYS = require('../config.js');
}

// Setup server to listen on process.en.PORT delegating to port 3000
var port = process.env.PORT || 3000;
var key = process.env.DB_USER || KEYS.user;
var db_pass = process.env.DB_PASSWORD || KEYS.password;

//init socketStream to null
var twitterTopic ;
// ** NEED TO IMPLEMENT Setup server to listen to MongoLab URI delegating to local db 
var mapDB = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/users-tweets';
mongoose.connect(mapDB);
db.init();

// Set Up Authorization 
var Auth = require('./auth/auth.js');
Auth.initialize();

// Setup app and routing
var app = express();

app.use(favicon(__dirname + '/../client/assets/favicon.ico'));

// Use Session Middleware
app.use(session({
  secret:'Keyboard Cat',
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Set up middleware stack
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

/* Routes */
app.use('/', routes);

var server = app.listen(port);  
console.log('App listening on ' + port);

//socket.io code below
socketService.connect(server);

module.exports = app;
