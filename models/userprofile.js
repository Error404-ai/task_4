const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const musicSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserVerification', required: true },
    name: { type: String, required: true },
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }], 
});

const ReferencedUser = mongoose.model('ReferencedUser', musicSchema);

module.exports = ReferencedUser;
