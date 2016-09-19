import React, { Component } from 'react';

export default class StatusText extends Component {
    render () {
        const { status } = this.props;
        return (
            <p className="status-text">{status || 'waiting for request'}</p>
        );
    }
}
