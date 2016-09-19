import React, { Component } from 'react';

export default class AssetProgress extends Component {
    render () {
        const { length, type, count } = this.props;
        const isComplete = count === length ? 'status__progress--complete' : '';

        return (
            <div className={ isComplete }>
                <p><span className="status__complete">✔</span> { count } / { length || 0 } { type } requested</p>
            </div>
        )
    }
}
