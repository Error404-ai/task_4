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
    required: true,
    validate: {
      validator: function (v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: 'Invalid URL for image',
    },
  },
  audio: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: 'Invalid URL for audio',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

SongSchema.index({ title: 1 });
SongSchema.index({ artist: 1 });

module.exports = mongoose.model('Song', SongSchema);
