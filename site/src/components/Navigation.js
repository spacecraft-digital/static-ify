import React, { Component } from 'react';

export default class Navigation extends Component {
    render () {
        const navigation = [
            { name: 'wiki', link: 'https://github.com/mikedevelops/static-ify/wiki' },
            { name: 'github', link: 'https://github.com/mikedevelops/static-ify' },
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
                </ul>
            </nav>
        )
    }
}
