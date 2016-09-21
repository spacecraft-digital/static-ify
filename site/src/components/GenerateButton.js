import React, { Component } from 'react';

export default class GenerateButton extends Component  {
    render () {
        const { statusCode } = this.props;
        let activeClass;

        switch (statusCode) {
            case 200:
                activeClass = ' button--disabled';
                break;
            default:
                activeClass = '';
                break;
        }

        return (
            <button className={`button form__submit${activeClass}`} type="submit" value="Generate bundle">
                <p className="button__text">Generate Bundle</p>
            </button>
        );
    }
}
