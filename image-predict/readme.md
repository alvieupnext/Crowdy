#### Practical information to execute the head counting service

1 - From the terminal run `npm install`.
2 - After installing the dependencies, test the model by executing the *test.js* running `node test.js`. The output of the execution should be similar to the text below:

        SCORE >= 0.6: 8
        WITHOUT SCORE FILTERING: 12

3 - After testing the model you can then run the server using the command `npm start`. The port used by the server instance it is currently hard-coded, you should do the necessary modifications to the file in order to containerize it.  

4- Notice that the image upload should be done with `multipart/form-data` post request. You should look at the code of the `server.js` and also the documentation of the `formidable` npm package (https://www.npmjs.com/package/formidable) to understand how to build the form to be sent to this service.
