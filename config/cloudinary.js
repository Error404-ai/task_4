const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dovwlptmy', 
  api_key: '489873486235255',      
  api_secret: 'ljIV8nsM9HZW8g7C6_LWaCvBODc'  
});

module.exports = cloudinary;
