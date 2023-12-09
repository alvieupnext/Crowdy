'user strict';

const stockCanvas = document.getElementById('stockCanvas');
const context = stockCanvas.getContext('2d');
const barWidth = stockCanvas.clientWidth / 20;

const nextPos = (x) => {
    const newPos = x + barWidth + 5;
    if (newPos > stockCanvas.clientWidth) {
        initialPos = 0;
        return initialPos;
    }
    return newPos;
}

const scale = 3;

const drawStockItem = (heigth, xPos, color) => {
    context.fillStyle = color;
    context.fillRect(xPos, stockCanvas.clientHeight - heigth, barWidth, heigth);
    return xPos;
}

// Load the total count and update the head count
let initialPos = 0;
const updateTotalCount = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "http://localhost:3000/crowdy/totalcount");

    xhr.onreadystatechange = (status) => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            const countData = JSON.parse(xhr.responseText);
            initialPos = drawStockItem(countData.count * scale, nextPos(initialPos), "green");
            document.getElementById('head-count').textContent = `Head Count: ${countData.count}`;
        }
    }
    xhr.send();
}

// Load the individual camera counts and update the image
const updateImages = () => {
    // for cameras 1 to 6
    for (let i = 1; i <= 6; i++) {
        // Using an IIFE to capture the current value of 'i'
        (function(currentCameraId) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `http://localhost:3000/crowdy/count/${currentCameraId}`);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    const countData = JSON.parse(xhr.responseText);
                    document.getElementById(`camera-num-${currentCameraId}`).textContent = countData.count;
                    const imageElement = document.getElementById(`cam-${currentCameraId}`);
                    //get the old image path
                    const oldImagePath = imageElement.src;
                    //if the old image path isn't equal to the new image path or to the video not found image
                    if (!oldImagePath.includes(countData.imagePath) && !oldImagePath.includes("videonotfound.png")) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('DELETE', oldImagePath);
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === XMLHttpRequest.DONE) {
                                if (xhr.status === 200) {
                                    console.log("Deleted old image");
                                }
                                else {
                                    console.log(`Error deleting old image. Error: ${xhr.status}`);
                                }
                        };
                    }
                        xhr.send();
                    }
                    imageElement.src = countData.imagePath
                }
            };
            xhr.send();
        })(i);
    }
};


/**
 * This function is used for updating the head count and images periodically
 */
function updateHeadCountAndImages() {
    setInterval(() => {
        updateTotalCount();
        updateImages();
    }, 3000);
}

updateHeadCountAndImages();
