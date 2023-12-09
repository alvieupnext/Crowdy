'user strict';

// document.addEventListener('DOMContentLoaded', function() {
//     const form = document.querySelector('form');

//     form.addEventListener('submit', function(e) {
//         e.preventDefault(); // Prevent the default form submission

//         const formData = new FormData(form);
//         const cameraId = formData.get('cameraId'); // Get the selected camera ID from the form
//         console.log(`Selected camera ID: ${cameraId}`);

//         fetch('http://localhost:3000/crowdy/image', {
//             method: 'POST',
//             body: formData
//         })
//         .then(response => {
//             console.log("Received response")
//             if (!response.ok) {
//                 throw new Error('Network response was not ok ' + response.statusText);
//             }

//             // Update the headcount number for the camera
//             const cameraNumber = document.getElementById(`camera-num-${cameraId}`);

//             if (cameraNumber) {
//                 console.log(cameraNumber.textContent)
//                 //get X-Head-Count header value from response
//                 console.log(response.headers);
//                 const headCount = response.headers.get('X-Head-Count');
//                 console.log(headCount);
//                 cameraNumber.textContent = headCount;
//                         }

//             return response.blob(); // Assuming the response is an image
//         })
//         .then(blob => {
//             console.log("Received image blob")
//             const imageUrl = URL.createObjectURL(blob);

//             // Select the corresponding image element for the camera
//             //By id "cam-number"
//             const cameraImage = document.getElementById(`cam-${cameraId}`);
//             if (cameraImage) {
//                 cameraImage.src = imageUrl;
//             } else {
//                 console.log("fuck");
//                 // If no image is found, create one and append it to the camera div
//                 const imageElement = document.createElement('img');
//                 imageElement.src = imageUrl;
//                 imageElement.style.maxWidth = '100%'; // Adjust the width as per grid item size
//                 imageElement.style.maxHeight = '100%'; // Adjust the height as per grid item size
//                 const cameraDiv = document.querySelector(`.grid-item:nth-child(${cameraId})`);
//                 cameraDiv.appendChild(imageElement);
//             }
//         })
//         .catch(error => {
//             console.error('There was a problem with the fetch operation:', error);
//         });
//     });
// });




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

//For excercise 2
const drawStockItem = (heigth, xPos, color) => {
    context.fillStyle = color;
    context.fillRect(xPos, stockCanvas.clientHeight - heigth, barWidth, heigth);
    return xPos;
}
//For excercise 2
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
 * This function is used for rendering the loadStock function results 
 */
function loadAndRenderStock1() {
    setInterval(() => {
        updateTotalCount();
        updateImages();

    }, 3000);
}


loadAndRenderStock1();
//To see the parallel rendering of the stocks uncomment the line below.
//Make sure you comment the loadAndRenderStock1() above.
//loadAndRenderStock2();
