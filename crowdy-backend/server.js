const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();

//Step 1: Get images from the camera's (These images should not be saved on the server)

//Step 2: Send the images directly to the Privacy Protection server
//Assume that the images are already in a readStream format


// Prepare the form data
const form = new FormData();
form.append('imageFileField', fs.createReadStream('./blurred_image_real_0.3.jpg')); // Ensure the path to the image is correct



// // Send the POST request
// axios.post('http://localhost:8002/crowdy/image/count', form, {
//     headers: {
//         ...form.getHeaders(),
//     }
// }).then((res) => {
//     console.log('Response:', res.data);
// }).catch((error) => {
//     console.error('Error:', error.response.data);
// });

// Send the POST request
// axios.post('http://localhost:8002/crowdy/image/count', form, {
//     headers: {
//         ...form.getHeaders(),
//     }
// }).then((res) => {
//     console.log('Response:', res.data);
// }).catch((error) => {
//     console.error('Error:', error.response.data);
// });

async function sendImageToServerAndSaveResponse(imagePath, serverUrl) {
    const form = new FormData();
    form.append('imageFileField', fs.createReadStream(imagePath));

    try {
        const response = await axios.post(serverUrl, form, {
            headers: {
                ...form.getHeaders(),
            },
            responseType: 'arraybuffer' // Important for receiving the image in binary format
        });

        const outputImagePath = 'blurred_image_real_0.4.jpg';
        fs.writeFileSync(outputImagePath, response.data);
        console.log(`Blurred image saved as ${outputImagePath}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example usage
const imagePath = './test-image.png'; // Replace with your image path
const serverUrl = 'http://localhost:8004/crowdy/image/blur'; // Replace with your server URL
sendImageToServerAndSaveResponse(imagePath, serverUrl);


// app.listen(3050, () => {
//     console.log('Crowdy is listening on port 3050');
// });

// Bash command for executing the server:

