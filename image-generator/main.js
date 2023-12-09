const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const imageFolderPath = path.join(__dirname, 'test-images');
const imageFiles = fs.readdirSync(imageFolderPath);

// A function to get a random image from the test-images folder
function getRandomImage() {
  // Generate a random index from 0 to imageFiles.length - 1
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  const randomImage = imageFiles[randomIndex];
  // Get the path of the random image
  const imagePath = path.join(imageFolderPath, randomImage);
  return fs.createReadStream(imagePath);
}

const maxCameraNumber = 6;
const port = 3000;

let errorCount = 0;

function sendRandomImage() {
  const formData = new FormData();
  // Add the image to the form as imageFileField
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
    errorCount++;
    console.log(`Error sending image, amount of errors: ${errorCount}`);
  });
}

// Send a random image every 1 to 10 seconds
setInterval(sendRandomImage, Math.floor(Math.random() * 9000) + 1000);
