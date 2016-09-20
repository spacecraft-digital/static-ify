import React, { Component } from 'react';
import io from 'socket.io-client';
import StaticForm from './components/StaticForm';
import DownloadButton from './components/DownloadButton';
import StaticDash from './components/StaticDash';
import Navigation from './components/Navigation';

export default class App extends Component {
    constructor (props) {
        super(props);
        this.socket = io();
        this.state = {
            status: null,
            statusCode: 100,
            bundle: {
                zip: null,
                dir: null
            },
            css: {
                length: null,
                count: 0
            },
            asset: {
                length: null,
                count: 0
            }
        };

        this.socket.on('status', (status) => {
            this.setState({
                status: status
            });
        });

        this.socket.on('status code', (code) => {
            this.setState({
                statusCode: code
            });
        });

        this.socket.on('css length', (css) => {
            this.setState({
                css: {
                    length: css.length,
                    count: css.count
                }
            });
        });

        this.socket.on('css complete', (css) => {
            this.setState({
                css: {
                    length: css.length,
                    count: css.count
                }
            });
        });

        this.socket.on('asset length', (asset) => {
            this.setState({
                asset: {
                    length: asset.length,
                    count: asset.count
                }
            });
        });

        this.socket.on('asset complete', (asset) => {
            this.setState({
                asset: {
                    length: asset.length,
                    count: asset.count
                }
            });
        });

        this.socket.on('zipped', (file) => {
            console.log(file);

            this.setState({
                bundle: {
                    zip: file.zip,
                    dir: file.dir
                }
            });
        });
    }

    updateAsset (asset) {
        this.setState({
            asset: {
                length: asset.length,
                count: asset.count
            }
        });
    }

    render () {
        const { status, statusCode, css, asset, bundle } = this.state;

        return (
            <div className="app">
                <div className="sidebar">
                    <StaticForm />
                    <p className="identity">Static-ify 2016 | <a className="identity__link" href="http://twitter.com/mikedevelops">MikeDevelops</a></p>
                </div>
                <div className="content">
                    <Navigation />
                    <StaticDash status={ status } statusCode={ statusCode } css={ css } asset={ asset } bundle={ bundle } />
                    <DownloadButton bundle={ bundle.zip } />
                </div>
            </div>
        );
    }
}
