"use strict";
const 	express = require('express'),
		router = express.Router(),
		jwt = require('jsonwebtoken'),
		Server = require('../models/server'),
		passport = require('passport'),
		mcping = require('mc-ping-updated'),
		config = require('../config/main');


// This is the /api router file!
/* 
Desired routes:
Get Servers
Get single server -> if not owner, return public info, if owner return sensitive data
Create Server -> isLoggedIn
Delete Server -> isServerOwner
Update Server -> isServerOwner
*/

// Get all servers for specified user
router.get('/servers/:user_id', function(req, res, next) {
	Server.find({ owner : req.params.user_id }, function(err, servers) {
		if (err) {return next(err)};
		return res.json(servers);
	})
})

// Get all servers
router.get('/servers', function(req, res, next) {
	Server.find({ hidden: false }).sort({ votes: -1 }).select('name address port image description owner status votes votifier.enabled').
		exec(function (err, servers) {
			if (err) {return next(err)};
			return res.json(servers);
		});
});

//Get specific server
router.get('/server/:server_id', function (req, res) {
	Server.findById(req.params.server_id, function(err, server) {
		if (err) {
			res.send('error');
		}
		res.json(server);
	});
})

//Create a server
router.post('/servers', passport.authenticate('jwt', { session: false }), function(req, res) {
	//This is very lazy validation, to do in future version, create error object
	// which accumulates the problems with the form and can return all problems at
	// once to user 
	if (!req.body.name) {
		return res.json({success: false, message: 'NAME REQUIRED'})
	}
	if (!req.body.address) {
		return res.json({success: false, message: 'ADDRESS REQUIRED'})
	}
	if (!req.body.image) {
		return res.json({success: false, message: 'IMAGE REQUIRED'})
	}
	if (!req.body.description) {
		return res.json({success: false, message: 'DESCRIPTION REQUIRED'})
	}

	var newServer = new Server();
	newServer.name = req.body.name;
	newServer.address = req.body.address;
	//if a custom port is specified, uses it otherwise defaults to 25565
	if (req.body.port) {
		newServer.port = req.body.port;
	} else {
		newServer.port = 25565;
	}

	//Check if server with address and port not already exists
	Server.findOne({ address: newServer.address, port: newServer.port }, function(err, server) {
		
	});

	newServer.image = req.body.image;
	newServer.description = req.body.description;
	newServer.owner = req.user._id; // Gives the current user id

	if (req.body.votifier_enabled) {
		//If votifier is enabled on this server
		newServer.votifier.enabled = true;
		if (!req.body.votifier_address) {
			return res.json({success: false, message: 'VOTIFIER ADDRESS REQUIRED'})
		}
		//if custom votifier port specified, it is used otherwise defaults to 8192
		if (req.body.votifier_port) {
			newServer.votifier.port = req.body.votifier_port;
		} else {
			newServer.votifier.port = 8192;
		}
		if (!req.body.votifier_pubkey) {
			return res.json({success: false, message: 'VOTIFIER PUBLIC KEY REQUIRED'})
		}
		newServer.votifier.address = req.body.votifier_address;
		newServer.votifier.pubkey = req.body.votifier_pubkey;
	};
	
	if(!req.body.hidden) {
		newServer.hidden = false;
	} else {
		newServer.hidden = req.body.hidden;
	};

	console.log('passed all verification');

	//Lastly: Verify that the server really does belong to this user,
	//checks that string config.VERIFY_OWNERSHIP_STRING is in servers motd
	mcping(req.body.address, req.body.port, function(err, stats) {
		if (err) {
			//Problem connecting to server
			return res.json({success: false, message: 'SERVER CONNECTION FAILED: Is your server online?'})
		} else {
			console.log('pinged server successfully')
			var status = stats;
			if (status.description.text.includes(config.VERIFY_OWNERSHIP_STRING)){
				newServer.status.online = true;
				newServer.status.currPlayers = status.players.online;
				newServer.status.maxPlayers = status.players.max;
			//Verification successful, server does belong to this user
				//Validation complete and newServer object created! Now to check if server with this address
				// and port doesn't already exist in the database
				Server.findOne({ address: newServer.address, port: newServer.port }, function(err, server) {
					if (err) {
						return res.json({success: false, message: 'Internal Error'});
					} else if (server) {
						//This server already exists in the database
						return res.json({success: false, message: 'SERVER ALREADY EXISTS'});
					} else {
						//All is good - continue saving to database
						newServer.save(function(err, server) {
							console.log('attempted to save the server');
							if (err) {
								//Theoretically - this should not happen unless theres an internal error
								console.log(err.errors);
								return res.json({success: false, message: err});
							} else if (server) {
								console.log('save successful')
								return res.json({success: true, _id: server._id});
							}
						});
					}
				})
			} else { //End if motd contains verification string
				return res.json({success: false, message: "SERVER VALIDATION FAILED: Is '" + config.VERIFY_OWNERSHIP_STRING + "' in your motd?"});
			}
		}
	}, 3000);
});


//Delete a server
router.delete('/server/:server_id', passport.authenticate('jwt', { session: false}), function(req, res) {
	console.log('delete server route')
	Server.findById(req.params.server_id, function(err, server) {
		if (err) {
			// Server does not exist
			res.json({success: false, message: 'Server not found'});
		} else if (server.owner.equals(req.user._id)) {
			// Server is found and the user is owner so can be deleted
			Server.remove({_id: req.params.server_id}, function(err, server) {
				if (err) {
					res.json({success: false, message: 'Error deleting server!'})
				} else {
					res.json({success: true})
				}
			})
		} else {
			console.log('User: ' + req.user._id + ', attempting to delete server owned by ' + server.owner);
			// Server found but this is not the owner
			res.json({success: false, message: 'Server is not yours'})
		}
	});
	
})


// Test route to see if logged in user is matt
router.get('/testAuth', passport.authenticate('jwt', { session: false }), function(req, res) {
	console.log(req.user);
	if (req.user) {
		if(req.user.username == "matt") {
		res.send("You are matt!");
		} else {
		res.send("You are not matt!");
		}
	} else {
		res.send("no req.user");
	}
	
})

module.exports = router;
