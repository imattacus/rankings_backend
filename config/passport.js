'use strict';
const User = require('../models/user'),
      config = require('./main'),
      JwtStrategy = require('passport-jwt').Strategy,
      ExtractJwt = require('passport-jwt').ExtractJwt;

//exported to be used by passport in server set up
module.exports = function (passport) {
  const jwtOptions = {  
    // Telling Passport to check authorization headers for JWT
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    // Telling Passport where to find the secret
    secretOrKey: config.secret
  };

  const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
    console.log(payload);
    User.findById(payload._id, function(err, user) {
      if (err) { return done(err, false); }

      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  });

  passport.use(jwtLogin);

}
