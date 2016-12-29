const 	mongoose = require('mongoose'),
		Schema = mongoose.Schema;

const ServerSchema = new Schema ({
	name: String,
	address: { type: String, required: true },
	port: { type: Number, default: 25565 },
	image: String,
	description: String,
	owner: { type: Schema.ObjectId, ref: 'User' },
	status: {
		online: Boolean,
		currPlayers: Number,
		maxPlayers: Number,
		lastPing: { type: Date, default: Date.now },
		lastOnline: { type: Date, default: Date.now }
	},
	votes: { type: Number, default: 0 },
	votifier: {
		enabled: { type: Boolean, required: true, default: false },
		address: String,
		port: Number,
		pubkey: String
	},
	hidden: { type: Boolean, required: true, default: false }
},
{
	timestamps: true
});

module.exports = mongoose.model('Server', ServerSchema);