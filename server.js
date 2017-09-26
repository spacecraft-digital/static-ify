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

const PORT = process.env.PORT || 8080;
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
});

app.get('/cli/test', (req, res) => {
    const eventEmitter = new events.EventEmitter();
    const bundle = new Staticify({
        requestUri: 'http://dev.sutton.pods.jadu.net/info/100001/advice_and_benefits/3/20_pages/2',
        assetPath: 'site',
        outputFile: 'index',
        targetUri: 'foo',
        verbose: true
    }, eventEmitter, io).initiate();

    res.send('fin');
});

io.on('connection', socket => {
    const eventEmitter = new events.EventEmitter();
    const cleanOutputOnLoad = new Staticify({}, null, io);

    cleanOutputOnLoad.cleanOutput(() => {
        cleanOutputOnLoad.socket.emit('status', 'ready for request');
    });

    socket.emit('status', 'connected to server');

    socket.on('disconnect', socket => {
        console.log('\n=====================');
        console.log(`RESET`);
        console.log('=====================\n');

        cleanOutputOnLoad.cleanOutput();
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
