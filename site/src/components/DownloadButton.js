import React, { Component } from 'react';

export default class DownloadButton extends Component {
    render () {
        const { bundle } = this.props;
        const bundleText = 'Download Bundle';
        const disabled = bundle ? '' : ' button--disabled';
        let link;

        if (bundle) {
            link = <a className="button__text" href={ bundle }>{ bundleText }</a>
        }
        else {
            link = <span className="button__text">{ bundleText }</span>
        }

        return (
            <button className={`button${disabled}`}>
                { link }
            </button>
        );
    }
}
