const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',  // Reference to the Song model 
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;
