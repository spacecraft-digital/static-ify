import React, { Component } from 'react';

export default class StaticInput extends Component {
    render () {
        const { type, id, name, placeholder } = this.props;
        return (
            <input className="form__field" type={type} id={id} placeholder={placeholder} name={name} />
        );
    }
}
