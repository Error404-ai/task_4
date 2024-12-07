const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'uploads/' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
console.log(path.resolve('uploads/'));

// Configure storage
const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    cb(null, '/uploads'); 
  },
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file names
  },
});

// File filter for images
const fileFilter = (_, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMimeType = allowedTypes.test(file.mimetype);

  if (isValidType && isValidMimeType) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit each file to 5MB
  fileFilter,
});

module.exports = upload;
