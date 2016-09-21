import React, { Component } from 'react';

export default class GenerateButton extends Component  {
    render () {
        let isValid = true;
        let activeClass = isValid ? '' : ' button--disabled';

        return (
            <button className={`form__submit button${activeClass}`} type="submit" value="Generate bundle">
                <p className="button__text">Generate Bundle</p>
            </button>
        );
    }
}
