"use strict";

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const events = require('events');
const Staticify = require('./src/Staticify.js');
const rimraf = require('rimraf');
const path = require('path');

const eventEmitter = new events.EventEmitter();
const PORT = process.env.PORT || 8000;
const PUBLIC = path.resolve(__dirname + '/site/public');

// middleware
app.use(bodyParser.json());
app.use(cors());

// serve front end
app.use(express.static(PUBLIC));

/**
 * Recursively remove output directory
 **/

function cleanOutput (callback = null) {
    const outputLocation = `${__dirname}/site/public/output/`;
    const outputZip = `${__dirname}/site/public/output_bundle.zip`;

    rimraf(outputLocation, {}, () => {
        console.log('removed output directory');

        rimraf(outputZip, {}, () => {
            console.log('removed output zip');

            if (callback) {
                callback();
            }
        });
    });
}

/**
* Socket connection
**/

http.listen(PORT, () => {
    console.log(`App listening on ${PORT}`);
    console.log(`Serving from ${PUBLIC}`);
});

io.on('connection', (socket) => {
    socket.on('request bundle', (data) => {
        io.emit('status', 'Server received request');
        io.emit('status code', 200);

        cleanOutput(() => {
            const { requestUri, fileName, redirectUri, assetPath } = data;
            const bundle = new Staticify({
                requestUri: requestUri,
                assetPath: assetPath,
                outputFile: fileName,
                targetUri: redirectUri,
                verbose: true
            }, eventEmitter, io).initiate();
        });
    });
});
