import React, { Component } from 'react';

export default class StatusText extends Component {
    render () {
        const { status } = this.props;
        return (
            <p className="status__text status__text--status">{status || '...'}</p>
        );
    }
}
