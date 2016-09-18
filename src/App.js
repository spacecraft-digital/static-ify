import React, { Component } from 'react';

import StaticForm from './components/StaticForm';
import './css/app.css';

const SERVER = 'http://localhost:8000';

export default class App extends Component {
    render () {
        return (
            <div className="app">
                <StaticForm serverUri={SERVER} />
            </div>
        );
    }
}
