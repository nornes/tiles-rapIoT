var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/tiles-api');
require('./models/Users');
require('./models/Tiles');
require('./models/Webhooks');
require('./models/EventMappings');
require('./models/AppRecipes');

var routes = require('./routes/index');
var users = require('./routes/users');
var webhooks = require('./routes/webhooks');
var eventMappings = require('./routes/eventMappings');
var appRecipes = require('./routes/appRecipes');

var ponteServer = require('./ponteServer');

var app = express();

app.set('appVersion', require('./package.json').version);
app.set('buildDate', new Date().toUTCString());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set CORS headers
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // Intercept OPTIONS requests
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  }
);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/webhooks', webhooks);
app.use('/eventmappings', eventMappings);
app.use('/appRecipes', appRecipes);
app.use('/cmd/*', function (req, res, next) {
  var resourceUrl = 'http://' + req.hostname + ':8080/resources/tiles/cmd/' + req.params[0];
  console.log('Redirect to ' + resourceUrl);
  return res.redirect(resourceUrl);
});
app.use('/evt/*', function (req, res, next) {
  var resourceUrl = 'http://' + req.hostname + ':8080/resources/tiles/evt/' + req.params[0];
  console.log('Redirect to ' + resourceUrl);
  return res.redirect(resourceUrl);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
