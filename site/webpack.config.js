var path = require('path');
var webpack = require('webpack');
var precss = require('precss');
var autoprefixer = require('autoprefixer');

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
                },
            },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'postcss', 'sass?outputStyle=compressed']
            }
        ]
    },
    postcss: () => [autoprefixer, precss],
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ],
    output: {
        filename: 'public/dist/bundle.js'
    },
    entry: [
        './src/index.js'
    ],
    colors: true
};
