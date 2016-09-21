import React, { Component } from 'react';

export default class ErrorLog extends Component {
    render () {
        // const { logs } = this.props;
        let logNodes = '';
        let logCount = 0;

        const logs = [
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'},
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'},
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'},
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'},
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'},
            { type: 'error', msg: '✘ Error retreiving asset: | https://www.norwich.gov.uk/site/styles/generic/standard-oldie.css'}
        ];

        if (logs) {
            logNodes = logs.map(log => {
                const { type, msg } = log;

                if (type === 'error') {
                    logCount++;

                    return (
                        <li className="error-log__item">
                            <p className="error-log__log">{ msg }</p>
                        </li>
                    );
                }
            });
        }

        return (
            <div className="error-log">
                <div className="error-log__top">
                    <h3 className="error-log__heading">Error Log</h3>
                    <p className="error-log__count">{ logCount }</p>
                </div>
                <ul className="error-log__list">{ logNodes }</ul>
            </div>
        );
    }
}
