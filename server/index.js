"use strict";

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const events = require('events');
const Staticify = require('./Staticify.js');
const rimraf = require('rimraf');
const path = require('path');

const eventEmitter = new events.EventEmitter();
const PORT = 8000;
const IP = '127.0.0.1';
const PUBLIC = path.resolve(__dirname + '/../public');

// middleware
app.use(bodyParser.json());
app.use(cors());

// serve front end
app.use(express.static(PUBLIC));

/**
* Simple CLI for quick debugging
**/
if (process.argv[2] === 'debug') {
    let test;
    if (process.argv[3] === 'norwich') {
        test = new Staticify({
            requestUri: 'https://www.norwich.gov.uk/info',
            targetUri: 'http://mike.com',
            removeMainContent: false,
            assetPath: 'site',
        }, eventEmitter);
    }
    else if (process.argv[3] === 'jsna') {
        test = new Staticify({
            requestUri: 'https://www.jsna.centralbedfordshire.gov.uk',
            targetUri: 'http://mike.com',
            removeMainContent: true
        }, eventEmitter);
    }
    else if (process.argv[3] === 'birmingham') {
        test = new Staticify({
            requestUri: 'https://www.birmingham.gov.uk/events',
            assetPath: 'site',
            targetUri: 'http://mike.com',
            removeMainContent: false
        }, eventEmitter);
    }
    else if (process.argv[3]) {
        test = new Staticify({
            requestUri: process.argv[3],
            targetUri: 'http://mike.com',
            assetPath: process.argv[4] ? process.argv[4] : 'debug/site',
            verbose: process.argv[5] ? true : false,
            removeMainContent: false
        }, eventEmitter);
    }
    else {
        test = new Staticify({
            requestUri: 'http://localhost:3000/debug/site/index.html',
            targetUri: 'http://mike.com',
            removeMainContent: false
        }, eventEmitter);
    }

    test.initiate();
}
else if (process.argv[2] === 'clean') {
    removeDirs(process.exit);
}

/**
 * Recursively remove output directory
 **/

function removeDirs (exit = null) {
    const outputLocation = `${__dirname}/../public/output/`;

    rimraf(outputLocation, {}, () => {
        console.log('removed output directory');
    });
}

/**
* Socket connection
**/

http.listen(PORT, IP, () => {
    console.log(`App listening on ${PORT}`);
    console.log(`Serving from ${PUBLIC}`);
    removeDirs();
});

io.on('connection', (socket) => {
    socket.on('request bundle', (data) => {
        const { requestUri, fileName, redirectUri, assetPath } = data;
        const bundle = new Staticify({
            requestUri: requestUri,
            assetPath: assetPath,
            outputFile: fileName,
            targetUri: redirectUri,
            verbose: true
        }, eventEmitter, io).initiate();

        io.emit('status', 'Server received request');
    });
});

/**
* Post request
**/

app.post('/', (req, res, next) => {
    console.log('got a POST request\n');

    const { requestUri, fileName, redirectUri, assetPath, removeMainContent } = req.body;

    const templates = new Staticify({
        requestUri: requestUri,
        assetPath: assetPath,
        outputFile: fileName,
        targetUri: redirectUri,
        removeMainContent: removeMainContent
    }, eventEmitter);

    let response = {};

    templates.initiate();

    eventEmitter.on('app:error', (msg) => {
        res.statusCode = 500;
        res.send(msg);
        res.end();
    });

    eventEmitter.on('html:success', (html) => {
        response['html'] = html;
    });

    eventEmitter.on('html:error', () => {
        res.statusCode = 500;
        res.send();
    });

    eventEmitter.on('zip:success', (data) => {
        response['data'] = data;
        res.send(response);
        res.end();

        console.log('response ended...');
    });
});

// app.listen(PORT, () => {
//     console.log(`App listening on ${PORT}`);
//     console.log(`Serving from ${PUBLIC}`);
//     removeDirs();
// });
