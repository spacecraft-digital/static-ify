import React, { Component } from 'react';
import DownloadButton from './DownloadButton';

export default class Navigation extends Component {
    render () {
        const { bundle } = this.props;
        const navigation = [
            { name: 'wiki', link: 'https://github.com/mikedevelops/static-ify/wiki' },
            { name: 'gitHub', link: 'https://github.com/mikedevelops/static-ify' },
            { name: 'issues', link: 'https://github.com/mikedevelops/static-ify/issues' }
        ];

        const navNodes = navigation.map(nav => {
            return (
                <li className="nav__item">
                    <a className="nav__link" href={ nav.link }>{ nav.name }</a>
                </li>
            );
        });

        return (
            <nav className="nav">
                <h1 className="logo">Static-ify</h1>
                <ul className="nav__list">
                    { navNodes }
                    <li className="nav__item">
                        <DownloadButton bundle={ bundle.zip } />
                    </li>
                </ul>
            </nav>
        )
    }
}
