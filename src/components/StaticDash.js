import React, { Component } from 'react';
import StatusText from './StatusText';
import AssetProgress from './AssetProgress';
import StaticFrame from './StaticFrame';

export default class StaticDash extends Component {
    constructor (props) {
        super(props);

        this.state = {
            iframeWidth: '100%'
        };

        this.resizeIframe = this.resizeIframe.bind(this);
    }

    componentDidMount () {
        this.resizeIframe();
        window.addEventListener('resize', this.resizeIframe);
    }

    resizeIframe () {
        const { iframe } = this.refs;
        // -2 to negate wrapper border
        const iframeWidth = (iframe.getBoundingClientRect().width * 2) - 2;

        this.setState({ iframeWidth: `${iframeWidth}px` });
    }


    render () {
        const { status, css, asset, bundle } = this.props;
        const { iframeWidth } = this.state;
        const requestStatus = '';

        return (
            <div ref="iframe" className={`iframe${requestStatus}`}>
                <div className="status">
                    <StatusText status={ status } />
                    <AssetProgress type="css" length={ css.length } count={ css.count } />
                    <AssetProgress type="asset" length={ asset.length } count={ asset.count } />
                </div>
                <div className="iframe__chrome">
                    <div className="iframe__ui"></div>
                    <div className="iframe__ui"></div>
                    <div className="iframe__ui"></div>
                </div>
                <div className="iframe__wrapper">
                    <StaticFrame bundle={ bundle.dir } iframeWidth={ iframeWidth } />
                </div>
            </div>
        );
    }
}
