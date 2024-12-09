const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const musicSchema = new Schema({
  name: { type: String, required: true }, // Username
  email: { type: String, required: true, unique: true }, // Email as a unique identifier
  profilePicture: { type: String, default: '' }, // Optional profile picture
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserVerification' },
});

const ReferencedUser = mongoose.model('ReferencedUser', musicSchema);

module.exports = ReferencedUser;
