import express from 'express';
import formidable from 'formidable';
import axios from 'axios';
// import Jimp from 'jimp';
import FormData from 'form-data';

import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import path from 'path';
import { fileURLToPath } from 'url';


// Obtain the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an express server
const app = express();
app.use('/', express.static('public'));

//Before starting the server, delete all the images in public/camera_images
const directory = path.join(__dirname, 'public/camera_images');
// Delete all the files in the directory
fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
  
    // Iterate through the files and delete each one
    files.forEach((file) => {
      const filePath = path.join(directory, file);
  
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        } else {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    });
  });

//This server is the middle point between all other servers
//Kubernetes will set the environment variables for the services
//Fallback to localhost if the environment variables are not set 
const privacyProtectionHost = process.env["PRIVACY_PROTECTION_SERVICE_HOST"] || "localhost";
const privacyProtectionPort = process.env["PRIVACY_PROTECTION_SERVICE_PORT"] || 8004;
const imagePredictHost = process.env["IMAGE_PREDICT_SERVICE_HOST"] || "localhost";
const imagePredictPort = process.env["IMAGE_PREDICT_SERVICE_PORT"] || 8002;

// Construct the service URLs using the environment variables
const privacyServerUrl = `http://${privacyProtectionHost}:${privacyProtectionPort}/crowdy/image/blur`;
const headCountingServerUrl = `http://${imagePredictHost}:${imagePredictPort}/crowdy/image/count`;

// Use these URLs to make HTTP requests to other services

//keep track of the 6 camera head counts in this array
const cameraHeadCounts = [0, 0, 0, 0, 0, 0];
const cameraPaths = ["videonotfound.png", "videonotfound.png", "videonotfound.png", "videonotfound.png", "videonotfound.png", "videonotfound.png"];

//Step 1: Get images from the camera's (These images should not be saved on the server)
app.post("/crowdy/image", async (req, res, next) => {
    const formData = formidable({});
    formData.parse(req, async (error, incomingFields, incomingFiles) => {
        if (error) {
            next(error);
            return;
        }

        try {
            console.log("Received camera upload picture request from the following camera:");
            console.log(incomingFields.cameraId[0]);
            //Step 1: Send the images directly to the Privacy Protection server 
            const blurredImage = await sendImageToServer(incomingFiles.imageFileField[0].filepath, privacyServerUrl, incomingFields.cameraId[0]);
            //Step 2: Save the blurred image locally
            const outputImagePath = saveImageLocally(blurredImage, uuidv4());
            //Step 3: Send the image to the Head Counting server
            const headCountResponse = await sendImageToServer(outputImagePath, headCountingServerUrl);
            //Response is expected to be an arraybuffer
            //Turn it into a json object
            const json = hexToJson(Buffer.from(headCountResponse.data).toString('hex'));
            //From the response, parse the json to get the count
            const numberOfPeople = json["count"];
            //Update the head count for the camera
            cameraHeadCounts[incomingFields.cameraId[0] - 1] = numberOfPeople;
            //Remove the public from the path
            const newOutputImagePath = outputImagePath.replace("./public/", "");
            //Update the image path for the camera
            cameraPaths[incomingFields.cameraId[0] - 1] = newOutputImagePath;
            console.log("Total number of people in the image: " + numberOfPeople);
            console.log("Total number of people in all images: " + cameraHeadCounts.reduce((a, b) => a + b, 0));

        } catch (err) {
            next(err);
        }
    });
});

//Add a /health endpoint to check if the server is running
app.get('/health', (req, res) => {
    res.send('Server is running');
});

// Function to Convert Hex String to JSON
function hexToJson(hexStr) {
    // Convert the hex string to a byte array
    const byteArray = new Uint8Array(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Convert the byte array to a string
    const str = new TextDecoder().decode(byteArray);

    // Parse the string into a JSON object
    return JSON.parse(str);
}


// Function to Send Image to Server
async function sendImageToServer(imagePath, serverUrl) {
    const form = new FormData();
    form.append('imageFileField', fs.createReadStream(imagePath));

    try {
        const response = await axios.post(serverUrl, form, {
            headers: {
                ...form.getHeaders(),
            },
            responseType: 'arraybuffer' // Important for receiving the image in binary format
        });
        return response;
    } catch (error) {
        console.error('Error:', error.message);
        return null; // Return null in case of error
    }
}

// Function to Save Image Locally
function saveImageLocally(response, name) {
    if (response) {
        const outputImagePath = `./public/camera_images/${name}.jpg`;
        fs.writeFileSync(outputImagePath, response.data);
        console.log(`Image saved as ${outputImagePath}`);
        return outputImagePath;
    } else {
        console.error('No response to save.');
        return null;
    }
}

//Get Request for the head count per camera
app.get('/crowdy/count/:cameraNumber', (req, res) => {
    const cameraNumber = parseInt(req.params.cameraNumber);

    // Check if cameraNumber is between 1 and 6
    if (cameraNumber >= 1 && cameraNumber <= 6) {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(
            // Assuming you have a function or a way to get the head count for a specific camera
            { count: cameraHeadCounts[cameraNumber - 1], imagePath : cameraPaths[cameraNumber - 1]}
        ));
    } else {
        // Handle the case where the camera number is not between 1 and 6
        res.status(400).send('Invalid camera number. Please use a number from 1 to 6.');
    }
});

//Get Request for the total head count
app.get('/crowdy/totalcount', (req, res) => {

    // Check if cameraNumber is between 1 and 6
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(
            // Assuming you have a function or a way to get the head count for a specific camera
            { count: cameraHeadCounts.reduce((a, b) => a + b, 0) }
        ));
});

// Handle DELETE request for deleting old images
app.delete('/camera_images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const filePath = path.join(__dirname, 'public/camera_images', imageName);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.send('File deleted');
    });
});

//Default port is 3000
const port = 3000;


app.listen(port)

console.log('Server listening on http://localhost:%d', port)

