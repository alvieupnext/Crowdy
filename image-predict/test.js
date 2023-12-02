import * as tf from '@tensorflow/tfjs-node'
import cocoSsd from '@tensorflow-models/coco-ssd';
import fs from 'fs';


async function testCounting() {
    const imageBuffer = loadImageFromDisk("test-image.png"); //other supported and tested extensions include jpg files.
    const tensorImage = tf.node.decodeImage(imageBuffer);
    const model = await cocoSsd.load();
    const predictions = await model.detect(tensorImage);
    console.log("SCORE >= 0.6:", predictions.filter(pred => pred.class === "person" && pred.score >= 0.6).length);
    console.log("WITHOUT SCORE FILTERING:", predictions.filter(pred => pred.class === "person").length);
}

await testCounting();

function loadImageFromDisk(path) {
    return fs.readFileSync(path);
}