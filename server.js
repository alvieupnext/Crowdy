import express from 'express';
import formidable from 'formidable';
import axios from 'axios';
// import Jimp from 'jimp';
import FormData from 'form-data';

import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use('/', express.static('public'));


// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'http://localhost:4400'); // or '*' for all origins
//     res.header('Access-Control-Expose-Headers', 'X-Head-Count');
//     next();
//   });

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

//Privacy Protection server
const privacyServerUrl = 'http://localhost:8004/crowdy/image/blur';
const headCountingServerUrl = 'http://localhost:8002/crowdy/image/count';

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
            //Step 2: Send the images directly to the Privacy Protection server 
            const blurredImage = await sendImageToServer(incomingFiles.imageFileField[0].filepath, privacyServerUrl, incomingFields.cameraId[0]);
            //Step 3: Save the image locally
            const outputImagePath = saveImageLocally(blurredImage, uuidv4());
            //Step 4: Send the image to the Head Counting server
            const headCountResponse = await sendImageToServer(outputImagePath, headCountingServerUrl);
            //Response is expected to be an arraybuffer
            //Turn it into a json object
            const json = hexToJson(Buffer.from(headCountResponse.data).toString('hex'));
            //From the response, parse the json to get the count
            console.log(json);
            const numberOfPeople = json["count"];
            //Update the head count for the camera
            cameraHeadCounts[incomingFields.cameraId[0] - 1] = numberOfPeople;
            //Remove the public from the path
            const newOutputImagePath = outputImagePath.replace("./public/", "");
            console.log(newOutputImagePath)
            //Update the image path for the camera
            cameraPaths[incomingFields.cameraId[0] - 1] = newOutputImagePath;
            console.log("Total number of people in the image: " + numberOfPeople);
            console.log("Total number of people in all images: " + cameraHeadCounts.reduce((a, b) => a + b, 0));
            //Step 5: Get the correct image and head count from the document and update it
            // document.getElementById(`cam-${incomingFields.cameraId[0]}`).src = outputImagePath;
            // document.getElementById(`camera-num-${incomingFields.cameraId[0]}`).textContent = numberOfPeople;

        } catch (err) {
            next(err);
        }
    });
});

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


// // Example usage
// const imagePath = './test-image.png'; // Replace with your image path
// const serverUrl = 'http://localhost:8004/crowdy/image/blur'; // Replace with your server URL
// sendImageToServerAndSaveResponse(imagePath, serverUrl);



// //Open index.html when accessing /
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

//get the count per cameraNumber
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

//get the sum 
app.get('/crowdy/totalcount', (req, res) => {

    // Check if cameraNumber is between 1 and 6
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(
            // Assuming you have a function or a way to get the head count for a specific camera
            { count: cameraHeadCounts.reduce((a, b) => a + b, 0) }
        ));
});


// app.get('/stock2', (req, res) => {
//     setTimeout(() => {
//         res.setHeader("Content-Type", "application/json");
//         res.send(JSON.stringify(
//             //this is the random stock data [0..100]
//             { data: Math.round(Math.random() * 100) }
//         ))
//     },  Math.round(Math.random() * 2000))
// });

// Handle DELETE request
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

const port = 3000;


app.listen(port)

console.log('Server listening on http://localhost:%d', port)

