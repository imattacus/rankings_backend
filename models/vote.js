const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		Server = require('./server'),
		config = require('../config/main'),
		votifier = require('votifier-send');

const VoteSchema = new Schema ({
	serverid: { type: Schema.ObjectId, ref: 'Server', required: true },
	cookie: { type: String, required: true }, //cookie value of user who voted
	datetime: { type: Date, default: Date.now },
	ipaddress: { type: String, required: true },
	mcusername: String
});

//Called before saving to database
//Needs to:
//	Verify server exists
//	Ensure no more than 5 votes for this cookie already exist
VoteSchema.pre('save', function(next) {
	const vote = this;

	//verify server exists, if so increment vote count
	Server.findOne({ _id: vote.serverid }, function(err, server) {
		if (err) {
			return next(err);
		} else {
			if (server) {
				//server does exist
				server.votes++;
				server.save();

				//attempt to find votes with this cookie value
				mongoose.model('Vote').find({ cookie: vote.cookie }, function(err, votes) {
					if (err) {
						return next(err);
					} else {
						if (Object.keys(votes).length < config.max_votes_day) {
							//if cookie has less than 5 votes registered to it this vote is allowed
							//to save
							next();
						} else {
							next(new Error('more than 5 votes!'));
						}
					}
				})

			} else {
				return next(new Error("server does not exist!"));
			}
		}
	});

});

//Called after saving to database
//Needs to:
//	Perform votifier connection if the vote has a mcusername specified
VoteSchema.post('save', function(vote) {
	Server.findOne({ _id: vote.serverid }, function(err, server) {
		if (err) {throw err};
		if (server && server.votifier.enabled && vote.mcusername !== undefined) {
			//Server should definitely exist because we checked in pre middleware
			//Send votifier to server
			var settings = {
				key: server.votifier.pubkey,
				host: server.votifier.address,
				port: server.votifier.port,
				data: {
					user: vote.mcusername,
					site: config.SERVICE_NAME,
					address: vote.ipaddress
				}
			};

			votifier.send(settings, function(err) {
				if (err) console.log(err);
				else console.log('Vote sent to ' + server.address + ' successfully');
			});


		};
	})
})




module.exports = mongoose.model('Vote', VoteSchema);