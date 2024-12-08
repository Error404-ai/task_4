const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  artist: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  duration: {
    type: Number, // Duration in seconds
  },
  image: {
    type: String,
    required: true, // Mark as required if every song must have an image
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model('Song', SongSchema);
