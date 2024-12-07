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
  album: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  genre: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  duration: {
    type: Number, // Duration in seconds
  },
  imageUrl: {
    type: String,
    required: true, // Mark as required if every song must have an image
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model('Song', SongSchema);
