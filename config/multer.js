const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary'); // Import Cloudinary setup

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'songs',
    allowed_formats: ['jpg', 'png', 'jpeg'] 
  }
});

const upload = multer({ storage });

module.exports = upload;
