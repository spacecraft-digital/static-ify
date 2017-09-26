import React, { Component } from 'react';

export default class Button extends Component {
    render () {
        const active = this.props.valid ? '' : ' button--disabled';

        return (
            <button className={`button${active}`} type="submit">
                { this.props.label
                    ? <p className="button__text">{ this.props.label }</p>
                    : this.props.children
                }
            </button>
        )
    }
}
