import React, { Component } from 'react';

export default class StaticInput extends Component {
    constructor (props) {
        super(props);

        this.idle = 100;
        this.valid = 200;
        this.error = 300;

        // status
        // 100 = idle
        // 200 = valid
        // 300 = invalid
        this.state = { status: this.idle }
    }

    validate (event) {
        const { value, name } = event.target;
        const { validateCallback } = this.props;
        let status;

        switch(name) {
            case 'requestUri':
            case 'redirectUri':
                status = this.validateUri(value);
                break;
            case 'fileName':
            case 'assetDir':
                status = this.validateValue(value);
                break;
        }

        validateCallback({ name: name, status: status  });
        this.setState({ status: status });
    }

    validateUri (value) {
        // very, very verbose regex
        const uriRegex = /(((http|ftp|https):\/{2})+(([0-9a-z_-]+\.)+(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?((\/([~0-9a-zA-Z\#\+\%@\.\/_-]+))?(\?[0-9a-zA-Z\+\%@\/&\[\];=_-]+)?)?))\b/;
        return value.match(uriRegex) ? this.valid : this.error;
    }

    validateValue (value) {
        return value !== '' ? this.valid : this.error;
    }

    render () {
        const { type, id, name, placeholder } = this.props;
        const { status } = this.state;
        let inputClass = '';

        switch(status) {
            case this.valid:
                inputClass = ' form__field--valid';
                break;
            case this.error:
                inputClass = ' form__field--error';
                break;
        }

        return (
            <input
                onChange={ this.validate.bind(this) }
                className={`form__field${ inputClass }`}
                type={ type }
                id={ id }
                placeholder={ placeholder }
                name={ name }
                required={ this.props.required }
            />
        );
    }
}
