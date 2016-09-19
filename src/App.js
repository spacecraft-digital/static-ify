import React, { Component } from 'react';
import io from 'socket.io-client';
import StaticForm from './components/StaticForm';
import StatusText from './components/StatusText';
import AssetProgress from './components/AssetProgress';
import DownloadButton from './components/DownloadButton';

const SERVER = 'http://localhost:8000';

export default class App extends Component {
    constructor (props) {
        super(props);
        this.socket = io(SERVER);
        this.state = {
            status: null,
            bundle: null,
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
            this.setState({
                bundle: file
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
                    <StaticForm server={SERVER} />
                </div>
                <div className="content">
                    <StatusText status={status} />
                    <AssetProgress type="css" length={css.length} count={css.count} />
                    <AssetProgress type="asset" length={asset.length} count={asset.count} />
                </div>
                <DownloadButton bundle={bundle} />
            </div>
        );
    }
}
