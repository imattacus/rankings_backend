var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');


const config = require('./config/main');

var mongoose = require('mongoose');
mongoose.connect(config.database);

var app = express();

/*  ==================================
          Initialize passport
        Bring in defined passport
              strategy
    ================================== */

require('./config/passport')(passport);
app.use(passport.initialize());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(function(req, res, next) {  
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.COOKIE_SIGNING_SECRET));
app.use(express.static(path.join(__dirname, 'public')));

/*  ==================================
          Set up and use routes
    ================================== */
var api = require('./routes/api');
var auth = require('./routes/auth');
var votes = require('./routes/vote');

app.use('/api/vote', votes);
app.use('/api', api);
app.use('/users', auth);

/*  ==================================
        Set up server ping schedule
            (every 5 minutes)
    ================================== */

var updateStats = require('./utilities/status-update');
var interval = setInterval(updateStats, 300000);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

if(process.env.NODE_ENV !== 'production') {
  process.once('uncaughtException', function(err) {
    console.error('FATAL: Uncaught exception.');
    console.error(err.stack||err);
    setTimeout(function(){
      process.exit(1);
    }, 100);
  });
}

module.exports = app;
