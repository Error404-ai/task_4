const express = require('express');
const Song = require('../models/song.js');
const ReferencedUser = require('../models/userprofile.js'); 
const Playlist = require('../models/playlist.js');
const UserVerification = require('../models/UserVerification.js');
const router = express.Router();

// Route to add a new referenced user
router.post('/referencedUser', async (req, res) => {
    const { name, playlists } = req.body;

    // Validate input
    if (!name) {
        return res.status(400).json({
            status: "FAILED",
            message: "name is required.",
        });
    }

    try {
        // Fetch user from UserVerification
        const userVerification = await UserVerification.findOne({name });
        const playlistsArray = Array.isArray(playlists) ? playlists : [playlists];

        if (!userVerification) {
            return res.status(404).json({
                status: "FAILED",
                message: "User not found in UserVerification.",
            });
        }

        const newReferencedUser = new ReferencedUser({
            userId : userVerification._id, 
            name,
            playlists: playlistsArray, 
        });

        const savedUser = await newReferencedUser.save();

        res.status(201).json({
            status: "SUCCESS",
            message: "Data added successfully to ReferencedUser.",
            data: savedUser,
        });
    } catch (error) {
        console.error("Error adding data to ReferencedUser:", error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while saving data.",
        });
    }
});

// Fetching user's profile
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      const userProfile = await ReferencedUser.findOne({ userId });

      if (!userProfile) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(userProfile);
  } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = req.body; // Extract the updated fields from the request body

  try {
      const updatedUser = await ReferencedUser.findOneAndUpdate(
          { userId },
          updates,
          { new: true } // Return the updated document
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(updatedUser);
  } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Deleting User's Profile
router.delete('/profile/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await ReferencedUser.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete associated playlists (if needed)
        if (user.playlists && user.playlists.length > 0) {
            await Playlist.deleteMany({ _id: { $in: user.playlists } });
        }

        // Delete the user profile
        await ReferencedUser.deleteOne({ userId });

        res.status(200).json({ message: 'User profile and associated playlists deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

  
const upload = require('../config/multer.js')

router.post('/upload-multiple', upload.array('images', 50), (req, res) => {
  try {
    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Build URLs for the uploaded files
    const fileUrls = req.files.map(file => ({
      filename: file.filename,
      url: `http://task-4-0pfy.onrender.com/uploads/${file.filename}`,
    }));

    res.status(200).json({
      message: 'Images uploaded successfully',
      files: fileUrls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
});

  // POST /songs - Add a new song
router.post('/songs',upload.single('image'), async (req, res) => {
    const { title, artist, album, genre, duration} = req.body;
    const imageUrl = `http://task-4-0pfy.onrender.com/uploads/${req.file.filename}`;
    try {
      const newSong = new Song({ title, artist, album, genre, duration, imageUrl});
      const savedSong = await newSong.save();
  
      res.status(201).json({ message: 'Song added successfully', song: savedSong });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add song', error: error.message });
    }
  });
  // GET /songs - Fetch all songs
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find(); // Fetch all songs from DB
    res.status(200).json({ songs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch songs' });
  }
});
  // GET /songs/search - Search songs by title or artist name GET (/songs/search?query=<term>)
  router.get('/songs/search', async (req, res) => {
    const { query } = req.query; // Get the search string from query params
    try {
      const searchResults = await Song.find({
        $or: [
          { title: { $regex: query, $options: 'i' } }, // Case-insensitive regex match on title
          { artist: { $regex: query, $options: 'i' } }, // Case-insensitive regex match on artist name
        ]
      });
      res.status(200).json({ songs: searchResults });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to perform search' });
    }
  });

// PUT /songs/:id - Update a song
router.put('/songs/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedSong = await Song.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updatedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json({ message: 'Song updated successfully', song: updatedSong });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update song', error: error.message });
  }
});

// DELETE /songs/:id - Delete a song
router.delete('/songs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSong = await Song.findByIdAndDelete(id);
    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete song', error: error.message });
  }
});



module.exports = router;
