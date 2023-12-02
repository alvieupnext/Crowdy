import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import express from 'express';
import formidable from 'formidable';
import Jimp from 'jimp';
import fs from 'fs';

const port = 8004;
const app = express();
// Load face-api.js models
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
}

loadModels().then(() => {
    app.listen(port, () => {
        console.log(`Privacy Protection server running on port ${port}`);
    });
});

app.post("/crowdy/image/blur", async (req, res, next) => {
    console.log("Received request to blur faces");
    const formData = formidable({});
    formData.parse(req, async (error, incomingFields, incomingFiles) => {
        if (error) {
            next(error);
            return;
        }

        try {
            const blurredImage = await blurFaces(incomingFiles.imageFileField[0].filepath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(blurredImage, 'binary');
            console.log(`Blurred faces in [${incomingFiles.imageFileField[0]["originalFilename"]}]`);
        } catch (err) {
            next(err);
        }
    });
});

async function blurFaces(filePath) {
    // Read the image file into a Buffer
    const imageBuffer = fs.readFileSync(filePath);

    // Detect faces in the image
    const detections = await detectFaces(imageBuffer);
    console.log("Faces detected");
    console.log(detections.length);

    // Load the image using Jimp
    const image = await Jimp.read(imageBuffer);

    // Iterate over each detection and blur the corresponding region
    for (const det of detections) {
        const { x, y, width, height } = det._box;
        await blurRegion(image, x, y, width, height);
    }

    // Get the modified image as a buffer
    return await image.getBufferAsync(Jimp.MIME_JPEG);
}

// async function detectFaces(image) {
//     const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
//     return await faceapi.detectAllFaces(image.bitmap, detectionOptions).withFaceLandmarks();
// }

async function detectFaces(imageBuffer) {
    console.log("Detecting faces...");

    // Decode the image file into a tf.Tensor3D
    const decodedImage = tf.node.decodeImage(imageBuffer);

    // Perform face detection with a lower confidence threshold
    const minConfidence = 0.3; // Lower this value to detect more faces
    const detections = await faceapi.detectAllFaces(decodedImage, new faceapi.SsdMobilenetv1Options({ minConfidence }));

    // Dispose the tensor to free memory
    tf.dispose(decodedImage);

    return detections;
}



async function blurRegion(image, x, y, width, height) {
    // Crop the region to blur
    const regionToBlur = image.clone().crop(x, y, width, height);

    // Apply blur to the cropped region
    regionToBlur.blur(10);

    // Composite the blurred region back onto the original image
    image.composite(regionToBlur, x, y);
}