const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const imageFolderPath = path.join(__dirname, 'test-images');
const imageFiles = fs.readdirSync(imageFolderPath);

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  const randomImage = imageFiles[randomIndex];
  const imagePath = path.join(imageFolderPath, randomImage);
  return fs.createReadStream(imagePath);
}

const maxCameraNumber = 6;
const port = 3000;

function sendRandomImage() {
  const formData = new FormData();
  formData.append('imageFileField', getRandomImage());
  //Generate a number from 1 to maxCameraNumber and add it to the form as cameraId
  formData.append('cameraId', Math.floor(Math.random() * maxCameraNumber) + 1);

  axios.post(`http://localhost:${port}/crowdy/image`, formData, {
    ...formData.getHeaders(),
  })
  .then(response => {
    console.log('Image sent successfully');
  })
  .catch(error => {
    console.log('Error sending image:');
  });
}

setInterval(sendRandomImage, Math.floor(Math.random() * 9000) + 1000);
