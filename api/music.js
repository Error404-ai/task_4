const express = require('express');
const Song = require('../models/song.js');
const ReferencedUser = require('../models/userprofile.js'); 
const Playlist = require('../models/playlist.js');
const UserVerification = require('../models/UserVerification.js');
const router = express.Router();

const { uploadImages, uploadAudios } = require('../config/multer.js');

const multer = require('multer');

// Helper function to convert "mm:ss" into total seconds
function convertTimeStringToSeconds(timeString) {
  if (!timeString) return 0; // Handle edge cases
  const [minutes, seconds] = timeString.split(':');
  return parseInt(minutes) * 60 + parseInt(seconds);
}

const upload = multer().fields([
  { name: 'images', maxCount: 26 },
  { name: 'audios', maxCount: 26 }
]);

router.post('/songs', upload, async (req, res) => {
  try {
    console.log('req.files:', req.files); // Log the uploaded files for debugging

    const songsString = req.body.songs;
    const { images, audios } = req.files;

    if (!songsString || !images || !audios) {
      return res.status(400).json({
        message: 'Invalid request. Ensure songs, images, and audios are provided.',
      });
    }

    let songData = [];
    try {
      songData = JSON.parse(songsString);
    } catch (error) {
      return res.status(400).json({
        message: 'Error parsing JSON string',
        error,
      });
    }

    if (
      songData.length !== images.length ||
      songData.length !== audios.length
    ) {
      console.error('Mismatch in counts');
      return res.status(400).json({
        message: 'Mismatch between number of songs, images, and audios.',
      });
    }

    const newSongs = songData.map((song, index) => {
      const imageFile = req.files.images?.[index];
      const audioFile = req.files.audios?.[index];

      if (!imageFile || !audioFile) {
        console.error(`Invalid file at index ${index}`);
        throw new Error(`Invalid file paths at index ${index}`);
      }

      return {
        title: song.title,
        artist: song.artist,
        duration: convertTimeStringToSeconds(song.duration),
        image: imageFile?.path,
        audio: audioFile?.path,
      };
    });

    console.log('Songs to be inserted:', newSongs);

    const savedSongs = await Song.insertMany(newSongs);

    res.status(201).json({ message: 'Songs added successfully!', songs: savedSongs });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to upload songs', error });
  }
});

//Api to get the latest songs
router.get('/songs', async(req,res) =>{
  try {
    const latestSongs = await Song.find()
      .sort({ addedAt: -1 }) // Sort by the most recently added
      .limit(10); // Limit the results to 10 songs
    res.status(200).json(latestSongs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest songs', error });
  }
});

router.get('/songs/search', async (req, res) => {
  try {
    const { query } = req.query; // Get the search query from query params
    const songs = await Song.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } },
      ],
    });

    res.status(200).json({ songs });
  } catch (error) {
    res.status(500).json({ message: 'Error performing search', error });
  }
});

// Create a new playlist
router.post('/createOrFind', async (req, res) => {
  try {
    const { newPlaylist } = req.body; // Extract the playlist name

    let playlist = await Playlist.findOne({ name: newPlaylist });

    if (!playlist) {
      playlist = new Playlist({
        name: newPlaylist,
        description: ' ',
      });

      await playlist.save();
      return res.status(201).json({ message: 'Playlist created successfully', playlist });
    }
    res.status(200).json({ message: 'Playlist found', playlist });
  } catch (error) {
    res.status(500).json({ message: 'Error creating or finding playlist', error });
  }
});


// Get all playlists
router.get('/all', async (req, res) => {
  try {
    const playlists = await Playlist.find().populate('songs');
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists', error });
  }
});

//Add a song to the user's existing Playlist
router.post('/addToPlaylist', async (req, res) => {
  try {
    const { playlistId, songId } = req.body;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Song already exists in playlist' });
    }

    playlist.songs.push(songId);
    const updatedPlaylist = await playlist.save();

    res.status(200).json({ message: 'Song added to playlist', playlist: updatedPlaylist });
  } catch (error) {
    res.status(500).json({ message: 'Error adding song to playlist', error });
  }
});

const User = require('../models/user.js');
router.get('/profile', async (req, res) => {
  try {
      // Extract user identifier (e.g., userID) from the request
      const userId = req.query.userId; 

      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      // Fetch user details from the database
      const user = await User.findById(userId).select('name email');
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send user details as response
      res.status(200).json({ name: user.name, email: user.email });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});

router.delete('/delete-account', async (req, res) => {
  const { userId } = req.body;

  try {
      // Delete user account
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting account', error });
  }
});

module.exports = router;
