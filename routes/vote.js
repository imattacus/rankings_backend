const express = require('express'),
	router = express.Router(),
	Vote = require('../models/vote'),
	uuid = require('node-uuid');

router.post('/:server_id', function(req, res) {
	console.log('voting for ' + req.params.server_id);
	var vote = new Vote();

	vote.serverid = req.params.server_id;

	if (req.body.mcusername) {
		vote.mcusername = req.body.mcusername;
	}

	var cookie;
	var cookieOwner;

	if (req.cookies.server_rank_vote === undefined) {
		//User does not already have cookie; have to send it a new cookie along with the json
		console.log('no cookie');
		cookie = uuid.v1();
		cookieOwner = false;
	} else {
		console.log('yes cookie');
		cookie = req.cookies.server_rank_vote;
		cookieOwner = true;
	}

	vote.ipaddress = req.ip;
	vote.cookie = cookie;

	vote.save(function(err) {
		console.log('saving to database');
		//Save this vote to database
		if (err) {
			console.log(err);
			//Error could be one of the many thrown in pre and post save in schema
		} else {
			if (!cookieOwner) {
				//if user did not already have the cookie send them this along with the json response
				res.cookie('server_rank_vote', cookie).json({success: true});
			} else {
				res.json({success:true});
			}
		}
	});
})

module.exports = router;