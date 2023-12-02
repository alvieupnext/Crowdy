import * as tf from '@tensorflow/tfjs-node'
import cocoSsd from '@tensorflow-models/coco-ssd';
import fs from 'fs';

import express from 'express';
import formidable from 'formidable';

const port = 8002;
const app = express();

/**
 * The form served by this route handler can be used for testing the ML model only.
 */

// app.get("/", (req, res) => {
//     res.send(`
//     <h2>With <code>"express"</code> npm package</h2>
//     <form action="/crowdy/count" enctype="multipart/form-data" method="post">
//       <div>Text field title: <input type="text" name="title" /></div>
//       <div>File: <input type="file" name="imageFileField" multiple="multiple" /></div>
//       <input type="submit" value="Upload" />
//     </form>
//   `);
// });

/** 
 * The handler in this path will do the head counting. 
 * The response of the handler is a JSON object with the following structure
 * 
 * { imageId: <image-id-based of the name given in the request>, count: <number of people found in the picture> }
 */

app.post("/crowdy/image/count", async (req, res, next) => {
    const formData = formidable({});
    formData.parse(req, async (error, incomingFields, incomingFiles) => {
        if (error) {
            next(error);
        } else {
            const count = await countHeads(incomingFiles.imageFileField[0].filepath);
            res.json({ imageId: incomingFiles.imageFileField[0]["originalFilename"], count });
            console.log(`Counted [${count}] heads in [${incomingFiles.imageFileField[0]["newFilename"]}]`);
        }
    })
})

app.listen(port, () => {
    console.log(`Head counting server running on port ${port}`)
})

async function countHeads(filepath) {
    const imageBuffer = loadImageFromDisk(filepath);
    const tensorImage = tf.node.decodeImage(imageBuffer);
    const model = await cocoSsd.load();
    const predictions = await model.detect(tensorImage);
    const count = predictions.filter(pred => pred.class === "person").length;
    return count;
}


function loadImageFromDisk(path) {
    return fs.readFileSync(path);
}