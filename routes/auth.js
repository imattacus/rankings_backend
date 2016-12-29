"use strict";
const 	express = require('express'),
		router = express.Router(),
		jwt = require('jsonwebtoken'),
		User = require('../models/user'),
		config = require('../config/main'),
		passport = require ('passport');

function generateToken(user) {
	return jwt.sign({_id: user._id}, config.secret, {
		expiresIn: 10080
	});
}

/*  ==================================
          Login Route, provides
         user with jwt if success
    ================================== */
router.post('/login', function(req, res) {

	User.findOne(
    	{username: req.body.username},
  	function(err, user) {
    	if (err) throw err;

    	if (!user) {
      		res.json({ success: false, message: 'Authentication unsuccessful.' });
    	} else {
	    	// Check if password matches
	    	user.comparePassword(req.body.password, function(err, isMatch) {
		        if (isMatch && !err) {
		          // Create token if the password matched and no error was thrown
		          var token = generateToken(user);
		          res.json({ success: true, user: user, token: token });
		        } else {
		          res.json({ success: false, message: 'Authentication unsuccessful.' });
		        }
      		});
    	}
  	});
});


/*  ==================================
       Registration route, provides
       user with jwt on completion
    ================================== */
router.post('/register', function(req, res) {

	//if both a username and a password are not supplied
  	if(!req.body.username || !req.body.password) {
  		res.json({success: false, message: "Username and password are both required fields!"});
  	} else {
  		var newUser = new User({
  			username: req.body.username,
  			password: req.body.password
  		});

  		newUser.save(function(err, user) {
  			if(err) {
  				res.json({success: false, message: "Account already exists"})
  			} else {
  				var token = generateToken(user);
  				res.json({success: true, user: user, token: token });
  			}
  		})
  	}

});

/*  ==================================
       Test Authentication Route
    ================================== */
router.get('/isAuth', passport.authenticate('jwt', { session: false }), function(req, res) {
	console.log(req.user);
	res.json({username: req.user.username});
});



module.exports = router;