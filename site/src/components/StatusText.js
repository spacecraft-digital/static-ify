import React, { Component } from 'react';

export default class StatusText extends Component {
    render () {
        const { status } = this.props;
        const statusText = status ? status : 'fill in the sidebar form to request a static bundle';

        return (
            <p className="status__text status__text--status">{statusText}</p>
        );
    }
}
