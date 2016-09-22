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

let isInitiated = false;

// middleware
app.use(bodyParser.json());
app.use(cors());

// serve front end
app.use(express.static(PUBLIC));

/**
* Socket connection
**/

http.listen(PORT, () => {
    console.log(`App listening on ${PORT}`);
    console.log(`Serving from ${PUBLIC}`);
});

io.on('connection', (socket) => {
    const cleanOutputOnLoad = new Staticify({}, null, io);

    socket.emit('status', 'connected to server');

    cleanOutputOnLoad.cleanOutput(() => {
        cleanOutputOnLoad.socket.emit('status', 'ready for request');
    });

    socket.on('request bundle', (data) => {
        if (!isInitiated) {
            isInitiated = true;
            io.emit('status', 'Server received request');
            io.emit('status code', 200);

            const { requestUri, fileName, redirectUri, assetPath } = data;
            const bundle = new Staticify({
                requestUri: requestUri,
                assetPath: assetPath,
                outputFile: fileName,
                targetUri: redirectUri,
                verbose: true
            }, eventEmitter, io).initiate();

            eventEmitter.on('app:complete', () => {
                isInitiated = false;
            });
        }
    });
});
