const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function uploadLogo() {
  try {
    const result = await cloudinary.uploader.upload('../src/assets/Logo/Logo-Full-Dark.png', {
      folder: process.env.FOLDER_NAME,
      public_id: 'studynotion_logo_email'
    });
    console.log("UPLOAD_SUCCESS");
    console.log(result.secure_url);
  } catch (err) {
    console.error("UPLOAD_FAILED", err);
  }
}

uploadLogo();
