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
    cleanOutput(process.exit);
}
