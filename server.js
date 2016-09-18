"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const events = require('events');
const CreateTemplate = require('./src/server/CreateTemplate.js').createTemplate;
const rimraf = require('rimraf');
const path = require('path');

const eventEmitter = new events.EventEmitter();
const app = express();
const PORT = process.env.PORT || 8000;

// middleware
app.use(bodyParser.json());
app.use(cors());

// serve front end
app.use(express.static(path.join(__dirname + '/public')));

// debug mode
if (process.argv[2] === 'debug') {
    let test;
    if (process.argv[3] === 'norwich') {
        test = new CreateTemplate({
            requestUri: 'https://www.norwich.gov.uk/info',
            targetUri: 'http://mike.com',
            removeMainContent: false,
            assetPath: 'site',
        }, eventEmitter);
    }
    else if (process.argv[3] === 'jsna') {
        test = new CreateTemplate({
            requestUri: 'https://www.jsna.centralbedfordshire.gov.uk',
            targetUri: 'http://mike.com',
            removeMainContent: true
        }, eventEmitter);
    }
    else if (process.argv[3] === 'birmingham') {
        test = new CreateTemplate({
            requestUri: 'https://www.birmingham.gov.uk/events',
            assetPath: 'site',
            targetUri: 'http://mike.com',
            removeMainContent: false
        }, eventEmitter);
    }
    else if (process.argv[3]) {
        test = new CreateTemplate({
            requestUri: process.argv[3],
            targetUri: 'http://mike.com',
            assetPath: process.argv[4] ? process.argv[4] : 'debug/site',
            verbose: process.argv[5] ? true : false,
            removeMainContent: false
        }, eventEmitter);
    }
    else {
        test = new CreateTemplate({
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
function removeDirs () {
    rimraf(__dirname + '/public/output', {}, () => {
        console.log('removed /output');
    });
    rimraf(__dirname + '/public/output.zip', {}, () => {
        console.log('removed /public/output.zip');
    });
}

app.post('/', (req, res, next) => {
    console.log('got a POST request\n');

    const { requestUri, fileName, redirectUri, assetPath, removeMainContent } = req.body;

    const templates = new CreateTemplate({
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

app.listen(PORT, () => {
    console.log(`App listening on ${PORT}`);
    removeDirs();
});
