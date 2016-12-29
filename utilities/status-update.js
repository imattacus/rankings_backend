const mongoose = require('mongoose'),
	Server = require('../models/server'),
	mcping = require('mc-ping-updated'),
	async = require('async');

module.exports = function () {
	console.log('Started updating statuses');
	Server.find({ hidden: false }, function(err, servers) {
		if (err) {
			console.log(err)
		} else {
			//async mapLimit maps a function to an iterable but with a limit on concurrent operations
			async.mapLimit(servers, 3, function(server, callback) {
				mcping(server.address, server.port, function(err, stats) {
					if (err) {
						server.status.online = false;
					} else {
						server.status.online = true;
						server.status.currPlayers = stats.players.online;
						server.status.maxPlayers = stats.players.max;
						server.status.lastOnline = Date.now();
					}

					console.log(server.name + ' is ' + server.status.online);

					server.status.lastPinged = Date.now();

					server.save(function(err, serv) {
						if (err) {
							callback(err);
						} else {
							callback(null, server.status.online);
						}
					})
				});
			})
		};
	});
}