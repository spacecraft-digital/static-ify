var path = require('path');
var webpack = require('webpack');

module.exports = {
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src')
                ],
                test: /\.js?$/,
                query: {
                    plugins: ['transform-runtime'],
                    presets: ['es2015', 'react']
                }
            }
        ]
    },
    output: {
        filename: 'public/dist/bundle.js'
    },
    entry: [
        './src/index.js'
    ],
    watch: true,
    colors: true,
    prigress: true
};
