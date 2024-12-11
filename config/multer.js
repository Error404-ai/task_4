const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');


// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'songs/images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `image-${Date.now()}`,
  },
});

// Cloudinary storage for audios
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'songs/audios',
    allowed_formats: ['mp3', 'mp4', 'aac'],
    public_id: (req, file) => `audio-${Date.now()}`,
  },
});

module.exports = {
  uploadImages: multer({ storage: imageStorage }),
  uploadAudios: multer({ storage: audioStorage }),
};
