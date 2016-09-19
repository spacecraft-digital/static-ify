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
    watch: true,
    colors: true
};
