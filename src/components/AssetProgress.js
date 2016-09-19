import React, { Component } from 'react';

export default class AssetProgress extends Component {
    render () {
        const { length, type, count } = this.props;

        return (
            <p>{ count } / { length || 0 } { type } requested</p>
        )
    }
}
