import React, { Component } from 'react';

export default class StaticFrame extends Component {
    render () {
        const { bundle, iframeWidth } = this.props;

        return (
            <iframe className="iframe__element" src={ bundle } width={ iframeWidth }></iframe>
        );
    }
}
