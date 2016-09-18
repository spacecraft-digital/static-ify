const Events = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
const should = chai.should();

chai.use(chaiAsPromised);

const Staticify = require('../Staticify.js');
const defaults = { requestUri: 'http://foo.com', targetUri: 'http://bar.com', verbose: false, assetPath: 'site', outputDir: 'public' };

describe('static-ify', () => {
    let staticify;
    let eventEmitter = new Events.EventEmitter();

    eventEmitter.setMaxListeners(100);

    describe('regex', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('href', () => {
            const stringToMatch = '<a href="foo">';
            let actual;

            stringToMatch.replace(staticify.regex.href, match => actual = match);

            const expected = 'href="foo"';

            return expect(actual).to.be.equal(expected);
        });

        it('src', () => {
            const stringToMatch = '<img src="foo">';
            let actual;

            stringToMatch.replace(staticify.regex.src, match => actual = match);

            const expected = 'src="foo"';

            return expect(actual).to.be.equal(expected);
        });

        it('url', () => {
            const stringToMatch = '<img style="content: url(\"foo\")">';
            let actual;

            stringToMatch.replace(staticify.regex.url, match => actual = match);

            const expected = 'url("foo")';

            return expect(actual).to.be.equal(expected);
        });

        it('grunticon', () => {
            const stringToMatch = 'grunticon(["foo", "foo", "foo"], grunticon.svgLoadedCallback);';
            let actual;

            stringToMatch.replace(staticify.regex.grunticon, match => actual = match);

            const expected = 'grunticon(["foo", "foo", "foo"]';

            return expect(actual).to.be.equal(expected);
        });

        it('double quotes', () => {
            const stringToExtract = 'href=\'foo\' src="bar" foo="foo"';
            const actual = stringToExtract.replace(staticify.regex.doubleQuo, '\'');
            const expected = 'href=\'foo\' src=\'bar\' foo=\'foo\'';

            return expect(actual).to.be.equal(expected);
        });

        it('single quote contents', () => {
            const stringToExtract = 'href=\'foo\' src=\'bar\' foo=\'foo\'';
            const actual = stringToExtract.match(staticify.regex.singleQuoContent).toString();
            const expected = ['\'foo\'', '\'bar\'', '\'foo\''].toString();

            return expect(actual).to.be.equal(expected);
        });

        it('parens', () => {
            const stringToExtract = 'url(foo)';
            const actual = stringToExtract.match(staticify.regex.parens).toString();
            const expected = '(foo)';

            return expect(actual).to.be.equal(expected);
        });

        it('relative directory', () => {
            const stringToExtract = '../../../some/file.js';
            const actual = stringToExtract.match(staticify.regex.upDir).join('');
            const expected = '../../../';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('handleUri()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns cache of non-local assets', () => {
            const source = 'foo';
            const uri = 'src="//ajax.some.cdn/index.js"';
            const actual = staticify.handleUri(source, uri);
            const expected = 'src="//ajax.some.cdn/index.js"';

            return expect(actual).to.be.equal(expected);
        });

        it('returns local URI that is not an asset and prepends targetURI', () => {
            const source = 'foo';
            const uri = 'href="http://foo.com/info"';
            const actual = staticify.handleUri(source, uri);
            const expected = 'href="http://bar.com/info"';

            return expect(actual).to.be.equal(expected);
        });

        it('stores the correct amount of assets', () => {
            staticify = new Staticify(defaults, eventEmitter);

            const testFile = '<a href="RRP_4570.JPG"> <a href="site/bar.js">';

            staticify.resourceSource = 'http://foo.com';
            testFile.replace(staticify.regex.href, (match) => {
                staticify.handleUri('href', match);
            });

            const actual = staticify.assets.length;
            const expected = 2;

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('getResourceSource()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('handles array of URIs', () => {
            const requestUri = ['http://foo.com/site/index.php'];
            const actual = staticify.getResourceSource(requestUri);
            const expected = 'http://foo.com/site';

            return expect(actual).to.be.equal(expected);
        });

        it('handles initial request URI with full path', () => {
            const requestUri = 'http://foo.com/site/index.php';
            const actual = staticify.getResourceSource(requestUri);
            const expected = 'http://foo.com/site';

            return expect(actual).to.be.equal(expected);
        });

        it('handles initial request URI with no path', () => {
            const requestUri = 'http://foo.com';
            const actual = staticify.getResourceSource(requestUri);
            const expected = 'http://foo.com/site';

            return expect(actual).to.be.equal(expected);
        });

        it('handles asset target', () => {
            const requestUri = 'http://foo.com/site/dist/main.css';
            const actual = staticify.getResourceSource(requestUri);
            const expected = 'http://foo.com/site/dist';

            return expect(actual).to.be.equal(expected);
        });

        it('handles asset with no host', () => {
            const requestUri = 'favicon.ico';
            const actual = staticify.getResourceSource(requestUri);
            const expected = 'http://foo.com/site';
            return expect(actual).to.be.equal(expected);
        });
    });

    describe('extractPath()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('extracts URI with double quotes', () => {
            const stringToExtract = '<a href="foo">';
            const actual = staticify.extractPath(stringToExtract).toString();
            const expected = 'foo';

            return expect(actual).to.be.equal(expected);
        });

        it('extracts URI with single quotes', () => {
            const stringToExtract = '<a href=\'foo\'>';
            const actual = staticify.extractPath(stringToExtract).toString();
            const expected = 'foo';

            return expect(actual).to.be.equal(expected);
        });

        it('extracts URI with no quotes', () => {
            const stringToExtract = 'url(foo)';
            const actual = staticify.extractPath(stringToExtract).toString();
            const expected = 'foo';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('prependProtocol()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('prepends protocol to protocol relative URIs', () => {
            const uri = ['//foo.com/bar'];
            const actual = staticify.prependProtocol(uri).toString();
            const expected = 'http://foo.com/bar';

            return expect(actual).to.be.equal(expected);
        });

        it('does not prepend protocol to URIs with a protocol', () => {
            const uri = ['http://foo.com/bar'];
            const actual = staticify.prependProtocol(uri).toString();
            const expected = 'http://foo.com/bar';

            return expect(actual).to.be.equal(expected);
        });

        it('ignores URIs that do not need a protocol', () => {
            const uri = ['../foo.js'];
            const actual = staticify.prependProtocol(uri).toString();
            const expected = '../foo.js';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('isLocalAsset()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns true for local assets', () => {
            const extractedPathArray = ['http://foo.com/dist/index.js'];
            const actual = staticify.isLocalAsset(extractedPathArray);

            return expect(actual).to.be.true;
        });

        it('returns true for local assets with no host', () => {
            const extractedPathArray = ['index.js'];
            const actual = staticify.isLocalAsset(extractedPathArray);

            return expect(actual).to.be.true;
        });

        it('returns false for URIs with no path', () => {
            const extractedPathArray = ['#foo'];
            const actual = staticify.isLocalAsset(extractedPathArray);

            return expect(actual).to.be.false;
        });

        it('returns false for external assets', () => {
            const extractedPathArray = ['http://cdn.jquery/some-crap-library.js'];
            const actual = staticify.isLocalAsset(extractedPathArray);

            return expect(actual).to.be.false;
        });
    });

    describe('getAssetType', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns the expected asset type', () => {
            const extractedPathArray = ['foo.js'];
            const actual = staticify.getAssetType(extractedPathArray);
            const expected = 'js';

            return expect(actual).to.be.equal(expected);
        });

        it('returns false for assets it doesn\'t understand', () => {
            const extractedPathArray = ['foo.bar'];
            const actual = staticify.getAssetType(extractedPathArray);

            return expect(actual).to.be.false;
        });
    });

    describe('getFilename()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns the extracted filename from a URI', () => {
            const extractedPathArray = ['http://foo.com/some/files/index.min.js'];
            const resourceType = 'js';
            const actual = staticify.getFilename(extractedPathArray, resourceType).toString();
            const expected = 'index.min.js';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('removeUriDirectory()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('removes 1 directory from the provided URI', () => {
            const resourceSource = 'http://foo.com/site/dist';
            const actual = staticify.removeUriDirectory(resourceSource);
            const expected = 'http://foo.com/site';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('getAssetTarget()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('handles root relative paths /foo/bar.js', () => {
            const extractedPathArray = ['/site/favicon.ico'];
            const resourceSource = staticify.getResourceSource('http://foo.com/site/favicon.ico');
            const relativePath = staticify.getRelativePath(extractedPathArray);
            const actual = staticify.getAssetTarget(extractedPathArray, resourceSource, { relativePath: relativePath }).toString();
            const expected = 'http://foo.com/site/favicon.ico';

            return expect(actual).to.be.equal(expected);
        });

        it('handles ../ relative paths ../../foo/bar.js', () => {
            const extractedPathArray = ['../../some/files/index.min.js'];
            const relativePath = staticify.getRelativePath(extractedPathArray);
            const resourceSource = staticify.getResourceSource('http://foo.com/site/dist/foo/');
            const actual = staticify.getAssetTarget(extractedPathArray, resourceSource, { relativePath: relativePath }).toString();
            const expected = 'http://foo.com/site/some/files/index.min.js';

            return expect(actual).to.be.equal(expected);
        });

        it('handles a path with a hostname, by returning extracted path', () => {
            const extractedPathArray = ['http://foo.com/site/dist/main.css'];
            const resourceSource = staticify.getResourceSource('http://foo.com/site/dist/foo/');
            const actual = staticify.getAssetTarget(extractedPathArray, resourceSource).toString();
            const expected = 'http://foo.com/site/dist/main.css';

            return expect(actual).to.be.equal(expected);
        });

        it('handles a path with no hostname', () => {
            const extractedPathArray = ['favicon.ico'];
            const resourceSource = staticify.getResourceSource('http://foo.com/');
            const actual = staticify.getAssetTarget(extractedPathArray, resourceSource).toString();
            const expected = 'http://foo.com/site/favicon.ico';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('getRelativePath()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns expected relative path', () => {
            const path = '../fonts/font.eot';
            const actual = staticify.getRelativePath(path).toString();
            const expected = '../';

            return expect(actual).to.be.equal(expected);
        });

        it('returns false if there is no relative path', () => {
            const path = 'fonts/font.eot';
            const actual = staticify.getRelativePath(path);

            return expect(actual).to.be.false;
        });
    });

    describe('handleRelativePath()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('handles relative path', () => {
            const path = '../fonts/font.eot';
            const relativePlath = path.match(staticify.regex.upDir);
            const resourceSource = staticify.getResourceSource('http://foo.com/site/dist/');
            const actual = staticify.handleRelativePath(path, relativePlath, resourceSource).toString();
            const expected = 'http://foo.com/site/fonts/font.eot';

            return expect(actual).to.be.equal(expected);
        });

        it('handles root relative path', () => {
            const path = '/site/dist/fonts/font.eot';
            const relativePlath = staticify.getRelativePath(path);
            const resourceSource = staticify.getResourceSource('http://foo.com/site/dist/fonts/font.eot');
            const actual = staticify.handleRelativePath(path, relativePlath, resourceSource).toString();
            const expected = 'http://foo.com/site/dist/fonts/font.eot';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('addSlash()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('appends a slash if one does not exist', () => {
            const path = '/something/foo/bar';
            const actual = staticify.addSlash(path);
            const expected = '/something/foo/bar/';

            return expect(actual).to.be.equal(expected);
        });

        it('does not append a slash if one exists', () => {
            const path = '/something/foo/bar/';
            const actual = staticify.addSlash(path);
            const expected = '/something/foo/bar/';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('removeSlash()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('removes slash if one exists', () => {
            const path = '/something/foo/bar/';
            const actual = staticify.removeSlash(path);
            const expected = '/something/foo/bar';

            return expect(actual).to.be.equal(expected);
        });

        it('ignores path if slash does not exists', () => {
            const path = '/something/foo/bar';
            const actual = staticify.removeSlash(path);
            const expected = '/something/foo/bar';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('getAssetDestination()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns the expected destination', () => {
            const assetType = 'js';
            const filename = ['main.js'];
            const actual = staticify.getAssetDestination(assetType, filename).toString();
            const expected = 'javascript/main.js';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('storeAsset()', () => {
        it('stores a single CSS asset target and destination', () => {
            staticify = new Staticify(defaults, eventEmitter);

            const assetTargets = ['http://foo.com/site/dist/main.css'];
            const assetDestinations = ['dist/css/main.css'];

            staticify.storeAsset(assetTargets, assetDestinations, { isCss: true });

            const actual = JSON.stringify(staticify.css);
            const expected = '[{"target":"http://foo.com/site/dist/main.css","destination":"dist/css/main.css"}]';

            return expect(actual).to.be.equal(expected);
        });

        it('stores multiple CSS assets targets and destinations', () => {
            staticify = new Staticify(defaults, eventEmitter);

            const assetTargets = ['http://foo.com/site/dist/foo.css', 'http://foo.com/site/dist/bar.css'];
            const assetDestinations = ['dist/css/foo.css', 'dist/css/bar.css'];

            staticify.storeAsset(assetTargets, assetDestinations, { isCss: true });

            const actual = JSON.stringify(staticify.css);
            const expected = '[{"target":"http://foo.com/site/dist/foo.css","destination":"dist/css/foo.css"},{"target":"http://foo.com/site/dist/bar.css","destination":"dist/css/bar.css"}]';

            return expect(actual).to.be.equal(expected);
        });

        it('stores a single asset target and destination', () => {
            staticify = new Staticify(defaults, eventEmitter);

            const assetTargets = ['http://foo.com/site/dist/main.js'];
            const assetDestinations = ['dist/css/main.js'];

            staticify.storeAsset(assetTargets, assetDestinations);

            const actual = JSON.stringify(staticify.assets);
            const expected = '[{"target":"http://foo.com/site/dist/main.js","destination":"dist/css/main.js"}]';

            return expect(actual).to.be.equal(expected);
        });

        it('stores multiple assets targets and destinations', () => {
            staticify = new Staticify(defaults, eventEmitter);

            const assetTargets = ['http://foo.com/site/dist/RRP_4570.JPG', 'http://foo.com/site/dist/bar.png'];
            const assetDestinations = ['dist/css/RRP_4570.JPG', 'dist/css/bar.png'];

            staticify.storeAsset(assetTargets, assetDestinations);

            const actual = JSON.stringify(staticify.assets);
            const expected = '[{"target":"http://foo.com/site/dist/RRP_4570.JPG","destination":"dist/css/RRP_4570.JPG"},{"target":"http://foo.com/site/dist/bar.png","destination":"dist/css/bar.png"}]';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('replaceAssetPath()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('returns url() as expected', () => {
            const assetSource = 'url';
            const destination =  ['images/RRP_4570.JPG'];
            const actual = staticify.replaceAssetPath(assetSource, destination);
            const expected = 'url(\'images/RRP_4570.JPG\')';

            return expect(actual).to.be.equal(expected);
        });

        it('returns href="" as expected', () => {
            const assetSource = 'href';
            const destination =  ['images/RRP_4570.JPG'];
            const actual = staticify.replaceAssetPath(assetSource, destination);
            const expected = 'href="images/RRP_4570.JPG"';

            return expect(actual).to.be.equal(expected);
        });

        it('returns src="" as expected', () => {
            const assetSource = 'src';
            const destination =  ['images/RRP_4570.JPG'];
            const actual = staticify.replaceAssetPath(assetSource, destination);
            const expected = 'src="images/RRP_4570.JPG"';

            return expect(actual).to.be.equal(expected);
        });

        it('returns grunticon([] as expected', () => {
            const assetSource = 'grunticonGroup';
            const destination =  ['foo.css', 'bar.css'];
            const actual = staticify.replaceAssetPath(assetSource, destination);
            const expected = 'grunticon(["foo.css","bar.css"]';

            return expect(actual).to.be.equal(expected);
        });

        it('handles root relative URIs', () => {
            const assetSource = 'href';
            const destination =  ['images/RRP_4570.JPG'];
            const path = '/images/RRP_4570.JPG';
            const relativePath = staticify.getRelativePath(path);
            const actual = staticify.replaceAssetPath(assetSource, destination, { relativePath: relativePath });
            const expected = 'href="images/RRP_4570.JPG"';

            return expect(actual).to.be.equal(expected);
        });

        it('handles ../ relative URIs', () => {
            const assetSource = 'url';
            const destination =  ['fonts/font.eot'];
            const path = ['../fonts/font.eot'];
            const relativePath = staticify.getRelativePath(path);
            const actual = staticify.replaceAssetPath(assetSource, destination, { relativePath: relativePath });
            const expected = 'url(\'../fonts/font.eot\')';

            return expect(actual).to.be.equal(expected);
        });
    });

    describe('saveFile()', () => {
        staticify = new Staticify(defaults, eventEmitter);

        it('it does not prepend output DIR if it already exists', () => {
            const body = 'foo';
            const destination = 'public/output/foo.html';
            const actual = staticify.saveFile(body, destination);
            const expected = 'public/output/foo.html';

            return expect(actual).to.be.equal(expected);
        });
    });
});
