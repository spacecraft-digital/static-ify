import React, { Component } from 'react';
import io from 'socket.io-client';
import StaticForm from './components/StaticForm';
import DownloadButton from './components/DownloadButton';
import StaticDash from './components/StaticDash';

export default class App extends Component {
    constructor (props) {
        super(props);
        this.socket = io();
        this.state = {
            status: null,
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
            this.updateStatus(status);
        });

        this.socket.on('css length', (css) => {
            this.updateCss(css);
        });

        this.socket.on('css complete', (css) => {
            this.updateCss(css);
        });

        this.socket.on('asset length', (asset) => {
            this.updateAsset(asset);
        });

        this.socket.on('asset complete', (asset) => {
            this.updateAsset(asset);
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

    updateStatus (status) {
        this.setState({
            status: status
        });
    }

    updateCss (css) {
        this.setState({
            css: {
                length: css.length,
                count: css.count
            }
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
        const { status, css, asset, bundle } = this.state;

        return (
            <div className="app">
                <div className="sidebar">
                    <StaticForm />
                </div>
                <div className="content">
                    <StaticDash status={ status } css={ css } asset={ asset } bundle={ bundle } />
                    <DownloadButton bundle={ bundle.zip } />
                </div>
            </div>
        );
    }
}
