const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'songs/images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

// Cloudinary storage for audios
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'songs/audios',
    allowed_formats: ['mp3', 'mp4', 'aac'],
  },
});

module.exports = {
  uploadImages: multer({ storage: imageStorage }),
  uploadAudios: multer({ storage: audioStorage }),
};
