import React, { Component } from 'react';

export default class ErrorLog extends Component {
    render () {
        const { logs } = this.props;
        let logNodes = '';
        let logCount = 0;
        let errorClass = '';

        if (logs) {
            logNodes = logs.map((logData) => {
                const { type, msg } = logData;

                if (type === 'error') {
                    logCount++;
                    errorClass = ' error-log__list--active';

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
                <ul className={`error-log__list${ errorClass }`}>{ logNodes }</ul>
            </div>
        );
    }
}
