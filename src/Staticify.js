"use strict"

/**
*
* Static-ify
* Author: Michael Smart
*
**/

const colors = require('colors');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const rp = require('request-promise-native');
const fs = require('fs');
const url = require('url');
const beautify = require('js-beautify').html;
const _defaults = require('lodash.defaults');
const zipFolder = require('zip-folder');

const requestOptions = {
    encoding: 'binary'
};

// TODO LIST
// 1. prevent duplicate assets being retrieved
// 2. ensure output directory is properly cleared down before starting each initiation

const defaults = {
    outputDir: '../site/public/output',
    outputFile: 'output',
    hasGrunticon: true,
    assetPath: 'debug/site',
    removeMainContent: false,
    removeScriptContent: false,
    verbose: true,
    // might not need dir & path, files will live on server
    resources: {
        'ico': 'favicon',
        'css': 'css',
        'js': 'javascript',
        'svg': 'images',
        'png': 'images',
        'jpg': 'images',
        'eot': 'fonts',
        'woff': 'fonts',
        'ttf': 'fonts',
        'woff2': 'fonts'
    }
};

module.exports = class Staticify {
    constructor (options, eventEmitter, socket) {
        this.options = _defaults(options, defaults);
        this.eventEmitter = eventEmitter;
        this.registerEvents();
        this.socket = socket;

        this.regex = {
            href: /href=(?:"|')(.*?)(?:"|')/g,
            src: /src=(?:"|')(.*?)(?:"|')/g,
            url: /url\((.*?)\)/g,
            script: /([\w-]*\.)(?:html|php)/g,
            filename: /(?![..])([\w-]*\.)/g,
            // TODO: this will only match 2 periods in a filename, 'min.pkgd.bundle.js' will not match, improve this
            filenameWithExt: /(?![..])([\w-]*\.[\w]*.[\w]*)/g,
            parens: /\((.*?)\)/g,
            grunticon: /grunticon\(\[(.*?)]/g,
            grunticonAsset: /icons.\w.*?.css/g,
            doubleQuo: /(")/g,
            singleQuoContent: /'(.*?)'/g,
            quoteContents: /(?:"|')(.*?)(?:"|')/mg,
            attributeAndContent: /(\S+)=[\'"]?((?:(?!\/>|>|"|\'|\s).)+)/,
            mainTag: /(<main.*?>)/g,
            mainContent: /<main.*?>([\S\s]*)<\/main>/g,
            upDir: /\.\.\//g,
            scriptContent: /<script>([\S\s]*)<\/script>/g
        };

        // Let's get out of here if we don't have a requestUri or a targetUri
        // there's a good chance this will be taken care of on the front end
        if (!this.options.requestUri) {
            this.eventEmitter.emit('app:error', 'A requestUris was not provided');
        }

        // Cache resource length & types
        this.resourceTypes = Object.keys(this.options.resources);

        // get common URI types
        this.requestUri = this.buildRequestUri(this.options.requestUri);
        this.protocol = url.parse(this.requestUri).protocol;

        // application log
        this.log = [];

        // assets
        this.assets = [];
        this.css = [];

                // create output dir structure
        this.createDirs();

        // TODO improve this
        this.assetCount = {
            css: {
                count: 0,
                success: 0,
                length: 0
            },
            asset: {
                count: 0,
                success: 0,
                length: 0
            }
        };
    }

    /**
    * Register events
    **/
    registerEvents () {
        this.eventEmitter.on('app:error', this.handleAppError.bind(this));
        this.eventEmitter.on('replace:error', this.handleReplaceError.bind(this));
        this.eventEmitter.on('html:success', this.handleHtmlSuccess.bind(this));
        this.eventEmitter.on('html:error', this.handleHtmlError.bind(this));
        this.eventEmitter.on('css:complete', this.handleCssComplete.bind(this));
        this.eventEmitter.on('asset:success', this.handleAssetSuccess.bind(this));
        this.eventEmitter.on('asset:complete', this.handleAssetComplete.bind(this));
        this.eventEmitter.on('asset:error', this.handleAssetError.bind(this));
        this.eventEmitter.on('zip:success', this.handleZipSuccess.bind(this));
    }

    /**
    * Create directory structure
    **/
    createDirs () {
        // loop through assets
        for (let resource in this.options.resources) {
            mkdirp(`${__dirname}/${this.options.outputDir}/${this.options.resources[resource]}`, (err) => {
                if (err !== null) {
                    console.log('error creating resource dirs: ', err);
                }
            });
        }
    }

    /**
    * Get requestUri body
    **/
    initiate () {
        const destination = `${this.options.outputDir}/${this.options.outputFile}.html`;

        // create output dir structure
        this.createDirs();

        this.resourceSource = this.getResourceSource(this.requestUri);

        rp(this.options.requestUri, requestOptions)
        // success
        .then(body => {
            console.log('\n=====================');
            console.log(`✔ ${this.options.requestUri}`);
            console.log('=====================');

            body = this.parseHtml(body);

            this.saveFile(body, destination);
        })
        // error
        .catch(err => {
            console.log(err);
            console.log(`did not get a response from ${this.options.requestUri}`);
            this.eventEmitter.emit('html:error', this.options.requestUri);
        });
    }

    /**
    * parse HTML for assets
    **/
    parseHtml (body) {
        // If set, let's remove the main content before parsing for assets
        if (this.options.removeMainContent) {
            body = this.removeMainContent(body);
        }

        // href=""
        body = body.replace(this.regex.href, this.handleUri.bind(this, 'href'))
        // src=""
        .replace(this.regex.src, this.handleUri.bind(this, 'src'))
        // url("")
        .replace(this.regex.url, this.handleUri.bind(this, 'url'))
        // grunticon([""])
        .replace(this.regex.grunticon, this.handleUri.bind(this, 'grunticonGroup'));

        // request css and parse for assets and push, then grab all assets & check for duplicates
        this.assetCount.css.length = this.css.length;
        this.socket.emit('css length', this.assetCount.css);

        this.css.map(asset => {
            this.requestAsset(asset, { mode: 'css' });
        });

        this.eventEmitter.on('css:complete', () => {
            this.assetCount.asset.length = this.assets.length;
            this.socket.emit('asset length', this.assetCount.asset);

            this.assets.map(asset => {
                this.requestAsset(asset);
            });
        });

        return body;
    }

    /**
    * remove main content
    **/
    removeMainContent (body) {
        // grab <main ... > tag to use later
        const mainTag = this.regex.mainTag.exec(body);

        if (mainTag) {
            // empty contents of main tag
            return body.replace(this.regex.mainContent, `${mainTag[0]}</main>`);
        }
        else {
            return body;
        }
    }

    /**
     * Handle Uri
     */
    handleUri (source, uri) {
        const { targetUri } = this.options;

        uri = {
            assetTarget: '',
            assetType: '',
            cache: uri,
            destination: [],
            filename: [],
            resourceSource: this.resourceSource,
            assetSource: source,
            extractedPath: [],
            localAsset: false
        };

        // split grunticon and handle path
        if (source === 'grunticonGroup') {
            const splitGrunticon = uri.cache.match(this.regex.quoteContents);

            splitGrunticon.map(path => {
                this.handleUri('grunticon', path);
            });
        }

        // get extracted path & prepend protocol if needed
        uri.extractedPath = this.prependProtocol(this.extractPath(uri.cache));

        uri.localAsset = this.isLocalAsset(uri.extractedPath);

        // if URI is not considered a local asset, return cache as we do not need to deal with it
        if (!uri.localAsset) {
            return uri.cache;
        }

        // get asset type
        uri.assetType = this.getAssetType(uri.extractedPath);

        if (uri.assetType) {
            // get filename
            uri.filename = this.getFilename(uri.extractedPath, uri.assetType);

            // get relative path '../../' if one is pre
            uri.relativePath = this.getRelativePath(uri.extractedPath);

            // get asset target, this will be the URI used to request the asset
            uri.assetTarget = this.getAssetTarget(uri.extractedPath, uri.resourceSource, { relativePath: uri.relativePath }, uri.assetSource);

            // get asset destination, this will be where the asset is saved
            uri.destination = this.getAssetDestination(uri.assetType, uri.filename);

            // made this a switch just in case we want to further split asset types
            switch (uri.assetType) {
                case 'css':
                    this.storeAsset(uri.assetTarget, uri.destination, { isCss: true });
                    break;
                default:
                    this.storeAsset(uri.assetTarget, uri.destination);
                    break;
            }
        }
        else {
            // lets deal with URIs that are not assets, we need to return the path prepended with the new URI
            // we know that right now the only exception with multiple URLs is grunticon (which would have been caught above), so we're safe to use the index here
            // we are also at this point assuming that the only type of asset to get to this point will be a href
            const parsedPath = url.parse(uri.extractedPath[0]).path;
            return `href="${targetUri + parsedPath}"`;
        }

        if (this.options.verbose) {
            console.log(`CACHE: ${uri.cache}`.red);
            console.log(`EXTRACT: ${uri.extractedPath}`.yellow);
            console.log(`SOURCE: ${uri.resourceSource}`.cyan);
            console.log(`TARGET: ${uri.assetTarget}`.green);
            console.log(`DEST: ${uri.destination} \n`.magenta);
        }

        return this.replaceAssetPath(uri.assetSource, uri.destination, { relativePath: uri.relativePath });
    }

    /**
     * Is local asset
     */
    isLocalAsset (extractedPathArray) {
        let isLocalAsset = true;

        extractedPathArray.map(extractedPath => {
            const parsedUrl = url.parse(extractedPath);
            const { protocol, host } = parsedUrl;
            const parsedUrlWithProtocol = `${protocol}//${host}`;

            // assume if we do not have a path that we do not have an asset
            if (!parsedUrl.path) {
                isLocalAsset = false;
            }
            // if extracted path host does not equal request host, we know this is not a local asset
            // we need to check if a host exists, to allow host-less assets be local assets
            else if (host && parsedUrlWithProtocol !== this.requestUri) {
                isLocalAsset = false;
            }
        });

        return isLocalAsset;
    }

    /**
     * Extract Uri
     */
    extractPath (uri) {
        const replacedQuotes = uri.replace(this.regex.doubleQuo, '\'');
        const singleQuoteContent = replacedQuotes.match(this.regex.singleQuoContent);
        const extractedArray = [];

        // if we have a single set of quotes
        if (singleQuoteContent) {
            // remove quotes from extracted path
            singleQuoteContent.map(match => {
                extractedArray.push(match.replace(/'/g, ''));
            });
        }
        // if there are no quotes let's assume we have url(foo)
        else {
            const parenContents = uri.match(this.regex.parens);

            // replace '(' for ')' paren and remove
            parenContents.map(match => {
                match = match.replace(/\(/g, ')');
                extractedArray.push(match.replace(/\)/g, ''));
            });
        }

        return extractedArray;
    }

    /**
     * In order for the url to be parsed it needs to have a protocol, we will prepend the protocol from the requestUri to protocol relative URIs
     */
    prependProtocol (paths) {
        return paths.map(path => {
            if (path.substring(0, 2) === '//') {
                return this.protocol + path;
            }
            else {
                return path;
            }
        });
    }

    /**
     * get asset type
     */
    getAssetType (extractedPath) {
        let resourceType = false;

        // 1. split path on '?' to remove any query strings
        // 2. split on '.' and pop last item to ensure we grab the file extension
        // [0] here to grab the first extracted path in the array, we are assuming at this point that a parsed asset with multiple URIs will all be the same file type
        const resourceExtension = extractedPath[0].split('?')[0].split('.');
        const resourceExtensionLength = resourceExtension.length;
        const extension = resourceExtension.pop();

        // If the resource extension doesn't have a length greater than 1 it means there is not a file extension, so we don't need to look for one
        if (resourceExtensionLength > 1) {
            // check path against each resource in list
            this.resourceTypes.map(resource => {
                if (extension.toLowerCase().indexOf(`${resource}`) !== -1) {
                    resourceType = resource;
                }
            });
        }

        return resourceType;
    }

    /**
     * get file name
     */
    getFilename (extractedPathArray, assetType) {
        return extractedPathArray.map(path => {
            const parsedPath = url.parse(path).path;
            const filePrefix = parsedPath.match(this.regex.filename);

            return filePrefix.join('') + assetType;
        });
    }

    /**
     * get Asset Target
     */
    getAssetTarget (extractedPath, resourceSource, options = { relativePath: false }, assetSource = null) {
        const { relativePath } = options;
        let assetTarget = [];

        // if we have the grunticon group we don't need to push to the asset target array, this will be done for the individual grunticon paths
        if (assetSource === 'grunticonGroup') {
            return extractedPath;
        }

        extractedPath.map(path => {
            const parsedExtractedPath = url.parse(path);

            // Handle relative paths
            if (relativePath) {
                assetTarget.push(this.handleRelativePath(path, relativePath, resourceSource));
            }
            // handle paths with no host
            else if (!parsedExtractedPath.host) {
                assetTarget.push(this.addSlash(resourceSource) + path);
            }
            // for paths with a host, return extracted path
            else {
                assetTarget.push(extractedPath);
            }
        });

        return assetTarget;
    }

    /**
     * Handle relative paths
     */
    handleRelativePath (path, relativePath, resourceSource) {
        relativePath.map((path) => {
            if (path === '../') {
                resourceSource = this.removeUriDirectory(resourceSource);
            }
        });

        // return root relative paths
        if (path[0] === '/') {
            return this.removeSlash(this.requestUri) + path;
        }

        const splitTarget = path.split(this.regex.upDir);

        return this.addSlash(resourceSource) + splitTarget[splitTarget.length - 1];
    }

    /**
     * Get root relative path
     */
    getRelativePath (path) {
        // if uri is an array, for example an asset target, let's grab the first item. We are assuming at this point that multiple assets in the same target will have the same source
        if (typeof path === 'object') {
            path = path[0];
        }

        if (path[0] === '/') {
            // returning this as an array to be consistent with ../ paths
            return [`/${this.options.outputDir}/`];
        }

        const relativePath = path.match(this.regex.upDir);
        return relativePath && relativePath.length ? relativePath : false;
    }

    /**
     * add slash
     */
    addSlash (path) {
        const slash = (path[path.length - 1] !== '/') ? '/' : '';
        return path + slash;
    }

    /**
     * remove slash
     */
    removeSlash (path) {
        if (path[path.length - 1] === '/') {
            return path.slice(0, -1);
        }
        else {
            return path;
        }
    }

    /**
     * get asset destination, this the path to where the file will be saved
     */
    getAssetDestination (assetType, filename) {
        const { resources } = this.options;

        return filename.map(file => {
            return `${resources[assetType]}/${file}`;
        });
    }

    /**
     * Handle CSS asset
     */
    storeAsset (assetTargets, assetDestinations, mode = { isCss: false }) {
        if (mode.isCss) {
            assetTargets.map((assetTarget, index) => {
                this.css.push({
                    target: assetTarget,
                    destination: assetDestinations[index]
                });
            });
        }
        else {
            assetTargets.map((assetTarget, index) => {
                this.assets.push({
                    target: assetTarget,
                    destination: assetDestinations[index]
                });
            });
        }
    }

    /**
     * replace asset path
     */
    replaceAssetPath (assetSource, destination, options = { relativePath: false }) {
        const { relativePath } = options;
        let assetPrefix;
        let assetSuffix = '"';

        // if we have a relative path that is not root relative, prepend relative path
        if (relativePath && relativePath[0] === '../') {
            destination = relativePath.join('') + destination;
        }

        switch(assetSource) {
            case 'url':
                assetPrefix = `url('`;
                assetSuffix = '\')';
                break;
            case 'href':
                assetPrefix = 'href="';
                break;
            case 'src':
                assetPrefix = 'src="';
                break;
            case 'grunticonGroup':
                assetPrefix = 'grunticon([';
                assetSuffix = ']';

                destination = destination.map(path => {
                    return `"${path}"`;
                }).toString();
                break;
            case 'grunticon':
                // we don't need to do anything with individual grunticon paths as they are handled as a group
                return;
            default:
                this.eventEmitter.emit('replace:error', destination);
                break;
        }

        return assetPrefix + destination + assetSuffix;
    }

    /**
     * Return resource source minus filename
     */
    getResourceSource (uri) {
        // if uri is an array, for example an asset target, let's grab the first item. We are assuming at this point that multiple assets in the same target will have the same source
        if (typeof uri === 'object') {
            uri = uri[0];
        }

        const { assetPath } = this.options;
        const { path, host } = url.parse(uri);
        let resourceSource;

        // if there is no path but we have a host, return with the appended asset path
        if (!path && host || path === '/' && host) {
            return `${this.protocol}//${host}/${assetPath}`;
        }
        else if (!host) {
            return `${this.requestUri}/${assetPath}`;
        }

        resourceSource = uri.split('/');
        // cache resource split length
        const lastItem = resourceSource.length - 1;
        // if last item in uri is a file, remove it
        resourceSource[lastItem] = resourceSource[lastItem].replace(this.regex.filenameWithExt, '');
        resourceSource.pop();
        // join uri back together
        resourceSource = resourceSource.join('/');

        return resourceSource;
    }

    /**
     * Build request Uri from options
     */

    buildRequestUri (requestUri) {
        const { protocol, host } = url.parse(requestUri);
        return `${protocol}//${host}`;
    }

    /**
     * Navigate up one directory and return new uri
     */
    removeUriDirectory (resourceSource) {
        // split uri
        resourceSource = resourceSource.split('/');

        let uriIterator = resourceSource.length;

        // iterate through split uri in reverse
        for (uriIterator; uriIterator--;) {
            // if uri item is not empty remove it and break out of loop
            if (resourceSource[uriIterator] !== '') {
                resourceSource.splice(uriIterator, 1);
                break;
            }
        }

        // join back up on with slashes
        return resourceSource.join('/');
    }

    /**
     * request asset
     **/
    requestAsset (asset, options = { mode: 'asset' }) {
        const { mode } = options;

        rp(asset.target.toString(), requestOptions)
        // success
        .then(body => {
            if (mode === 'css') {
                this.resourceSource = this.getResourceSource(asset.target);
                body = body.replace(this.regex.url, this.handleUri.bind(this, 'url'));
            }

            this.saveFile(body, asset.destination);
            this.assetCount[mode].success++;
            this.eventEmitter.emit('asset:success', asset.target);
        })
        // error
        .catch(err => {
            this.eventEmitter.emit('asset:error', err, asset.target);
        })
        // always
        .then(() => {
            this.assetCount[mode].count++;
            this.socket.emit(`${mode} complete`, this.assetCount[mode]);
            this.socket.emit('status', asset.target);

            if (this.assetCount[mode].count === this.assetCount[mode].length) {
                console.log(`${mode}:complete`);
                this.eventEmitter.emit(`${mode}:complete`);
            }
        });
    }

    /**
     * Get file size
     */
     getFileSize (file) {
        const stats = fs.statSync(file);
        return `${Math.round(stats['size'] / 1024)}kb`;
    }

    /**
    * Handle App Error
    **/
    handleAppError () {
        if (this.options.verbose) {
            console.log('=====================');
            console.log('✘ App Error!');
            console.log('=====================\n');
        }
    }

    /**
    * Handle Html success
    **/
    handleHtmlSuccess (body) {
        if (this.options.verbose) {
            console.log('\n=====================');
            console.log('✔ Saved your HTML');
            console.log('=====================\n');
        }

        this.html = body;
    }

    /**
     * Handle Html error
     */
    handleHtmlError (target) {
        if (this.options.verbose) {
            console.log(`✘ error getting response from: ${target}`);
        }
    }

    /**
     * Handle all CSS retrieved
     **/
     handleCssComplete () {
        if (this.options.verbose) {
            console.log('\n=====================');
            console.log(`✔ css retrieved  ${this.assetCount.css.success}/${this.assetCount.css.count}`);
            console.log('=====================\n');
        }
     }

    /**
    * Handle asset success
    **/
    handleAssetSuccess (target) {
        const msg = `✔ Retreived your asset: | ${target}`;

        if (this.options.verbose) {
            console.log(`${msg}`.green);
        }
    }

    /**
     * Handle asset complete
     */
    handleAssetComplete () {
        const msg = `✔ assets retrieved  ${this.assetCount.asset.success}/${this.assetCount.asset.count}`;

        this.log.push({
            type: 'success',
            msg: msg,
            meta: null
        });

        console.log('\n=====================');
        console.log(msg);
        console.log('=====================\n');


        this.log.map(log => {
            if (log.type === 'error') {
                console.log(`${log.msg}`.red);
            }
        });

        this.socket.emit('status code', 300);

        this.zipOutput();
    }

    /**
     * Handle replace error
     */
    handleReplaceError (uri) {
        const msg = `✘ Couldn't handle: ${uri}`.red;

        this.log.push({
            'type': 'error',
            'msg': msg
        });
    }

    /**
    * Handle asset fail
    **/
    handleAssetError (err, file) {
        const msg = `✘ Error retreiving asset: | ${file} \n`;

        this.log.push({
            'type': 'error',
            'msg': msg,
            'meta': err
        });
    }

    /**
     * Handle ZIP success
     */
    handleZipSuccess (data) {
        if (this.options.verbose) {
            console.log('\n=====================');
            console.log(`✔ zipped your assets: ${data.destination}`);
            console.log('=====================\n');
        }
    }

    /**
     * Save file
     */
    saveFile (body, destination) {
        const { outputDir } = this.options;

        if (destination.indexOf(outputDir) < 0) {
            destination = `${outputDir}/${destination}`;
        }

        fs.writeFile(__dirname + '/' + destination, body, 'binary', (err) => {
            if (err && err !== null && this.options.verbose) {
                console.log(`✘ Error saving file: ${destination} | ${err}`.red);
            }
        });

        return destination;
    }

    /**
     * Zip output
     */
    zipOutput () {
        const { outputDir } = this.options;
        const source = `${__dirname}/${outputDir}`;
        const destination = `${__dirname}/../site/public/output_bundle.zip`;

        // TODO: call this from the front end
        zipFolder(source, destination, (err) => {
            if (err) {
                console.log('zipOutput: ', err);
            }
            else {
                let data = {
                    destination: 'output_bundle.zip',
                    // size: this
                    // .getFileSize(`${__dirname}/${destination}`),
                    log: this.log
                };

                this.eventEmitter.emit('zip:success', data);
            }
        });

        this.socket.emit('zipped',  { zip: 'output_bundle.zip', dir: 'output/foo.html' });
        this.eventEmitter.emit('zip:success', this.html);
    }
};
