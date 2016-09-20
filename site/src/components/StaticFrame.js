import React, { Component } from 'react';

export default class StaticFrame extends Component {
    render () {
        const { bundle, iframeWidth } = this.props;
        const bundleDestination = bundle ? `output/${bundle}` : '';

        return (
            <iframe className="iframe__element" src={ bundleDestination } width={ iframeWidth }></iframe>
        );
    }
}
