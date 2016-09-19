import React, { Component } from 'react';

export default class GenerateButton extends Component  {
    render () {
        return (
            <button className="button form__submit" type="submit" value="Generate bundle">
                <p className="button__text">Generate Bundle</p>
            </button>
        );
    }
}
