import React, { Component } from 'react';

export default class StaticFrame extends Component {
    render () {
        const { bundle, iframeWidth } = this.props;

        return (
            <iframe src={ bundle } width={ iframeWidth }></iframe>
        );
    }
}
