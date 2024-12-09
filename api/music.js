const express = require('express');
const Song = require('../models/song.js');
const ReferencedUser = require('../models/userprofile.js'); 
const Playlist = require('../models/playlist.js');
const UserVerification = require('../models/UserVerification.js');
const router = express.Router();

const upload = require('../config/multer.js');

//Api to add multiple songs
router.post('/songs', upload.array('images', 14), async (req, res) => {
  try {
    console.log("Raw Songs Received:", req.body.songs); // Log raw `songs`
    const songsString = req.body.songs;
    let songData = [];

    if (songsString) {
      try {
        songData = JSON.parse(songsString); // Parse JSON string
      } catch (error) {
        return res.status(400).json({
          message: 'Error parsing songs JSON string',
          error,
        });
      }
    }

    console.log('Parsed Songs:', songData);
    console.log('Images:', req.files.length);

    if (!songData || songData.length !== req.files.length) {
      return res.status(400).json({
        message: 'Each song must have a corresponding image!',
        songDataLength: songData.length,
        imageFilesLength: req.files.length,
      });
    }

    console.log(songData);
    

    // Helper function to convert "mm:ss" into total seconds
    function convertTimeStringToSeconds(timeString) {
      const [minutes, seconds] = timeString.split(':');
      return parseInt(minutes) * 60 + parseInt(seconds);
    }

    const newSongs = songData.map((song, index) => ({
      title: song.song,
      artist: song.artist,
      duration: convertTimeStringToSeconds(song.duration), // Convert to seconds
      image: req.files[index].path, // Cloudinary URL
    }));

    const savedSongs = await Song.insertMany(newSongs);

    res.status(201).json({ message: 'Songs added successfully!', songs: savedSongs });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error adding songs', error });
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

router.get('/profile', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email, profilePicture } = user;

    return res.status(200).json({ name, email, profilePicture });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});












































// router.post('/user/createOrFind', async (req, res) => {
//   try {
//     const { email, name } = req.body;
//     if (!email || !name) {
//       return res.status(400).json({ message: 'Email and name are required' });
//     }

//     // Check if user already exists
//     let user = await ReferencedUser.findOne({ email });
//     if (!user) {
//       user = new ReferencedUser({
//         email,
//         name,
//         playlists: [],
//         profilePicture: '', // Default empty profile picture
//       });

//       await user.save();

//       return res.status(201).json({ message: 'User created successfully', user });
//     }

//     res.status(200).json({ message: 'User found', user });
//   } catch (error) {
//     res.status(500).json({ message: 'Error finding or creating user', error });
//   }
// });

// router.put('/profile/picture', async (req, res) => {
//   try {
//     const { email, picture } = req.body; // `email` identifies the user, `picture` contains base64 image data

//     if (!picture) {
//       return res.status(400).json({ message: 'Profile picture is required' });
//     }

//     // Find the user
//     const user = await ReferencedUser.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Upload image to Cloudinary
//     const uploadResponse = await cloudinary.uploader.upload(picture, {
//       folder: 'profile_pictures',
//     });
//     user.profilePicture = uploadResponse.secure_url;
//     const updatedUser = await user.save();

//     res.status(200).json({
//       message: 'Profile picture updated successfully',
//       profilePicture: updatedUser.profilePicture,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error uploading profile picture', error });
//   }
// });

// //fetching user profile
// router.get('/profile', async (req, res) => {
//   try {
//     const { email } = req.query;

//     const userProfile = await ReferencedUser.findOne({ email })
//       .populate('playlists')
//       .exec();

//     if (!userProfile) {
//       return res.status(404).json({ message: 'User profile not found' });
//     }

//     res.status(200).json(userProfile);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching profile', error });
//   }
// });

// //update profile
// router.put('/profile', async (req, res) => {
//   try {
//     const { email, name, newEmail, profilePicture } = req.body;

//     const userProfile = await ReferencedUser.findOne({ email });

//     if (!userProfile) {
//       return res.status(404).json({ message: 'User profile not found' });
//     }

//     if (name) userProfile.name = name;
//     if (newEmail) userProfile.email = newEmail; // Update email if provided

//     if (profilePicture) {
//       const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
//         folder: 'profile_pictures',
//       });
//       userProfile.profilePicture = uploadResponse.secure_url;
//     }

//     const updatedProfile = await userProfile.save();
//     res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating profile', error });
//   }
// });






























































































// // Route to add a new referenced user
// router.post('/referencedUser', async (req, res) => {
//     const { name, playlists } = req.body;

//     // Validate input
//     if (!name) {
//         return res.status(400).json({
//             status: "FAILED",
//             message: "name is required.",
//         });
//     }

//     try {
//         // Fetch user from UserVerification
//         const userVerification = await UserVerification.findOne({name });
//         const playlistsArray = Array.isArray(playlists) ? playlists : [playlists];

//         if (!userVerification) {
//             return res.status(404).json({
//                 status: "FAILED",
//                 message: "User not found in UserVerification.",
//             });
//         }

//         const newReferencedUser = new ReferencedUser({
//             userId : userVerification._id, 
//             name,
//             playlists: playlistsArray, 
//         });

//         const savedUser = await newReferencedUser.save();

//         res.status(201).json({
//             status: "SUCCESS",
//             message: "Data added successfully to ReferencedUser.",
//             data: savedUser,
//         });
//     } catch (error) {
//         console.error("Error adding data to ReferencedUser:", error);
//         res.status(500).json({
//             status: "FAILED",
//             message: "An error occurred while saving data.",
//         });
//     }
// });

// // Fetching user's profile
// router.get('/profile/:userId', async (req, res) => {
//   const { userId } = req.params;

//   try {
//       const userProfile = await ReferencedUser.findOne({ userId });

//       if (!userProfile) {
//           return res.status(404).json({ message: 'User not found' });
//       }

//       res.status(200).json(userProfile);
//   } catch (error) {
//       console.error('Error fetching user profile:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Update user profile
// router.put('/profile/:userId', async (req, res) => {
//   const { userId } = req.params;
//   const updates = req.body; // Extract the updated fields from the request body

//   try {
//       const updatedUser = await ReferencedUser.findOneAndUpdate(
//           { userId },
//           updates,
//           { new: true } // Return the updated document
//       );

//       if (!updatedUser) {
//           return res.status(404).json({ message: 'User not found' });
//       }
//       res.status(200).json(updatedUser);
//   } catch (error) {
//       console.error('Error updating user profile:', error);
//       res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Deleting User's Profile
// router.delete('/profile/:userId', async (req, res) => {
//     const { userId } = req.params;

//     try {
//         const user = await ReferencedUser.findOne({ userId });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Delete associated playlists (if needed)
//         if (user.playlists && user.playlists.length > 0) {
//             await Playlist.deleteMany({ _id: { $in: user.playlists } });
//         }

//         // Delete the user profile
//         await ReferencedUser.deleteOne({ userId });

//         res.status(200).json({ message: 'User profile and associated playlists deleted successfully.' });
//     } catch (error) {
//         console.error('Error deleting user profile:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

  
// const upload = require('../config/multer.js')

// router.post('/upload-multiple', upload.array('images', 50), (req, res) => {
//   try {
//     // Check if files are uploaded
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No files uploaded' });
//     }

//     // Build URLs for the uploaded files
//     const fileUrls = req.files.map(file => ({
//       filename: file.filename,
//       url: `http://task-4-0pfy.onrender.com/uploads/${file.filename}`,
//     }));

//     res.status(200).json({
//       message: 'Images uploaded successfully',
//       files: fileUrls,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to upload images', error: error.message });
//   }
// });

//   // POST /songs - Add a new song
// router.post('/songs',upload.single('image'), async (req, res) => {
//     const { title, artist, album, genre, duration} = req.body;
//     const imageUrl = `http://task-4-0pfy.onrender.com/uploads/${req.file.filename}`;
//     try {
//       const newSong = new Song({ title, artist, album, genre, duration, imageUrl});
//       const savedSong = await newSong.save();
  
//       res.status(201).json({ message: 'Song added successfully', song: savedSong });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Failed to add song', error: error.message });
//     }
//   });
//   // GET /songs - Fetch all songs
// router.get('/songs', async (req, res) => {
//   try {
//     const songs = await Song.find(); // Fetch all songs from DB
//     res.status(200).json({ songs });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to fetch songs' });
//   }
// });
//   // GET /songs/search - Search songs by title or artist name GET (/songs/search?query=<term>)
//   router.get('/songs/search', async (req, res) => {
//     const { query } = req.query; // Get the search string from query params
//     try {
//       const searchResults = await Song.find({
//         $or: [
//           { title: { $regex: query, $options: 'i' } }, // Case-insensitive regex match on title
//           { artist: { $regex: query, $options: 'i' } }, // Case-insensitive regex match on artist name
//         ]
//       });
//       res.status(200).json({ songs: searchResults });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Failed to perform search' });
//     }
//   });

// // PUT /songs/:id - Update a song
// router.put('/songs/:id', async (req, res) => {
//   const { id } = req.params;
//   const updates = req.body;

//   try {
//     const updatedSong = await Song.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
//     if (!updatedSong) {
//       return res.status(404).json({ message: 'Song not found' });
//     }

//     res.status(200).json({ message: 'Song updated successfully', song: updatedSong });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to update song', error: error.message });
//   }
// });

// // DELETE /songs/:id - Delete a song
// router.delete('/songs/:id', async (req, res) => {
//   const { id } = req.params;

//   try {
//     const deletedSong = await Song.findByIdAndDelete(id);
//     if (!deletedSong) {
//       return res.status(404).json({ message: 'Song not found' });
//     }

//     res.status(200).json({ message: 'Song deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to delete song', error: error.message });
//   }
// });



module.exports = router;
