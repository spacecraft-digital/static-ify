import React, { Component } from 'react';

export default class DownloadButton extends Component {
    render () {
        const { bundle } = this.props;

        return (
            <button>
                <a href={ bundle || '#' }>BUNDLE</a>
            </button>
        );
    }
}
