import React, { Component } from 'react';
import io from 'socket.io-client';
import StaticInput from './StaticInput';
import GenerateButton from './GenerateButton';

export default class StaticForm extends Component {
    constructor (props) {
        super(props);

        this.socket = io();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            isValid: 0
        };
    }

    handleSubmit (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const postData = {
            requestUri: formData.get('requestUri'),
            fileName: formData.get('fileName'),
            redirectUri: formData.get('redirectUri'),
            assetDir: formData.get('assetDir'),
            removeMainContent: formData.get('removeMainContent')
        };

        this.socket.emit('request bundle', postData);
    }

    handleValidation (data) {

    }

    render () {
        const { serverUri, statusCode } = this.props;
        const { isValid } = this.state;

        return (
            <form className="form" method="post" action={ serverUri } onSubmit={ this.handleSubmit }>
                <div id="target" className="form__control">
                    <h2 className="form__heading">Target URI</h2>
                    <p className="optional">Required</p>
                    <p className="form__help">This is the URI (with protocol) of the web page you would like to retrieve. The second input is the name that you&rsquo;d like to call your output HTML file.</p>
                    <div className="form__group">
                        <div className="form__input">
                            <label className="visually-hidden" htmlFor="requestUri">Target URI</label>
                            <StaticInput validateCallback={ this.handleValidation.bind(this) } type="url" id="requestUri" name="requestUri" placeholder="http://dev.tyler.pods.jadu.net/" />
                        </div>
                        <div className="form__input">
                            <label className="visually-hidden" htmlFor="fileName">File name</label>
                            <StaticInput validateCallback={ this.handleValidation.bind(this) } type="text" id="fileName" name="fileName" placeholder="1-column-homepage" />
                        </div>
                    </div>
                </div>
                <div id="asset" className="form__control">
                    <h3 className="form__heading">Asset base directory</h3>
                    <p className="optional">Optional</p>
                    <p className="form__help">This is the path to the static assets relative to the index script. For the majority of Jadu implementations this will be <span className="code">site</span> for a galaxy implementation this would more than likely be <span className="code">site/your-galaxy</span></p>
                    <div className="form__group">
                        <div className="form__input">
                            <label className="visually-hidden" htmlFor="assetPath">Asset base directory</label>
                            <StaticInput validateCallback={ this.handleValidation.bind(this) } type="text" id="assetPath" name="assetDir" placeholder="site" />
                        </div>
                    </div>
                </div>
                <div id="redirect" className="form__control">
                    <h2 className="form__heading">Redirect URI</h2>
                    <p className="optional">Optional</p>
                    <p className="form__help">This is the URI the finished templates will point any links on the page to. An example would be if we set the redirect URI to <span className="code">http://www.tjc.edu/</span> the following link <span className="code">http://dev.tyler.pods.jadu.net/contact</span> would become <span className="code">http://www.tjc.edu/contact</span> This allows us to point any links in the static bundle to the client&rsquo;s live site.</p>
                    <div className="form__group">
                        <div className="form__input">
                            <label className="visually-hidden" htmlFor="redirectUri">Redirect URI</label>
                            <StaticInput validateCallback={ this.handleValidation.bind(this) } type="url" id="redirectUri" name="redirectUri" placeholder="http://www.tjc.edu/" />
                        </div>
                    </div>
                </div>
                <GenerateButton statusCode={ statusCode } />
            </form>
        );
    }
}
