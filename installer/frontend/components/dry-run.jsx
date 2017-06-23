import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { commitPhases } from '../actions';
import { TectonicGA } from '../tectonic-ga';

export const DryRun = connect(
  state => ({
    phase: state.commitState.phase,
    response: state.commitState.response,
    ready: state.cluster.ready,
  })
)(({phase, response, ready}) => {
  const inProgress = (phase === commitPhases.REQUESTED ||
                      phase === commitPhases.WAITING ||
                      phase === commitPhases.DRYRUN_SUCCEEDED && !ready);
  const errorMessage = response ? response.toString() : '';
  const errorClasses = classNames('wiz-error-message', {
    hidden: phase !== commitPhases.FAILED,
  });

  let content = <div className="form-group">
    Validate configuration, generate assets, but don't create the cluster using the 'Advanced Mode' on Submit (previous) page.
  </div>;

  if (inProgress) {
    content = <div className="wiz-giant-button-container">
        <button className="btn btn-primary wiz-giant-button disabled">
          <i className="fa fa-spin fa-circle-o-notch"></i>{' '}
          Generating assets...
        </button>
      </div>;
  }

  if (phase === commitPhases.DRYRUN_SUCCEEDED && ready) {
    content = <div>
      <div className="form-group">
        Your cluster assets have been created. You can download these assets and customize underlying infrastructure as needed.
        Note: changes to Kubernetes manifests or Tectonic components run in the cluster are not supported.
        &nbsp;<a href="https://coreos.com/tectonic/docs/latest/install/aws/manual-boot.html"
          onClick={TectonicGA.sendDocsEvent} target="_blank">
          Read more here.&nbsp;&nbsp;<i className="fa fa-external-link" />
        </a>
      </div>
      <div className="form-group">
        <div className="wiz-giant-button-container">
          <a href="/terraform/assets" download>
            <button className="btn btn-primary wiz-giant-button">
              <i className="fa fa-download"></i>&nbsp;&nbsp;Download assets
            </button>
          </a>
        </div>
      </div>
    </div>;
  }

  return <div className="row">
    <div className="col-xs-12">
      {content}
      <div className={errorClasses}>
        {errorMessage}
      </div>
    </div>
  </div>;
});

DryRun.canNavigateForward = () => false;
