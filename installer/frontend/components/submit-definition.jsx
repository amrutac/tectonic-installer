import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import { commitToServer } from '../server';
import { commitPhases } from '../actions';

const stateToProps = ({commitState, cluster}) => {
  const phase = commitState.phase;
  const response = commitState.response;
  const ready = cluster.ready;
  return {
    phase,
    response,
    ready,
  };
};

const dispatchToProps = dispatch => ({
  onSubmit: () => dispatch(commitToServer(false)),
  onDryRun: () => dispatch(commitToServer(true)),
});

export const SubmitDefinition = connect(stateToProps, dispatchToProps)(
class SubmitDefinitionComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    console.log('shouldComponentUpdate nextProps', nextProps.phase);
    if (nextProps && nextProps.phase === commitPhases.DRYRUN_SUCCEEDED && nextProps.ready) {
      this.props.navigateNext();
    }
    return true;
  }

  render () {
    const {phase, response, ready, onSubmit, onDryRun, navigatePrevious, navigateNext} = this.props;

    let feature =
    <div className="wiz-giant-button-container">
      <button className="btn btn-primary wiz-giant-button"
          onClick={() => onSubmit(false)}>
        Submit
      </button>
    </div>;

    let pager = '';

    const inProgress = (phase === commitPhases.REQUESTED ||
                        phase === commitPhases.WAITING ||
                        phase === commitPhases.SUCCEEDED && !ready);

    if (inProgress) {
      feature =
        <div className="wiz-giant-button-container">
          <button className="btn btn-primary wiz-giant-button disabled">
            <i className="fa fa-spin fa-circle-o-notch"></i>{' '}
            Checking Your Definition...
          </button>
        </div>;
    }

    if (phase === commitPhases.SUCCEEDED && ready) {
      feature = (
        <div>
          <div className="wiz-herotext wiz-herotext--success">
            <span className="fa fa-check-circle wiz-herotext-icon"></span> {' '}
            High Fives! <br /> Your matchbox server was configured successfully!
          </div>
        </div>
      );
      pager = (
        <div className="wiz-form__actions">
          <button className="btn btn-primary wiz-form__actions__next"
             onClick={navigateNext}
             >Next Step</button>
        </div>
      );
    }

    const errorMessage = response ? response.toString() : '';
    const errorClasses = classNames('wiz-error-message', {
      hidden: phase !== commitPhases.FAILED,
    });

    const msg = <span>Congratulations! Your cluster has been defined and will be submitted to Terraform.</span>;

    return (
      <div>
        <p>
          { msg }
          <span> After submission, the definition cannot be updated. Go <a onClick={!inProgress && navigatePrevious} className={inProgress && 'disabled'}>back</a> to update or make changes.</span>
        </p>
        <p>
          You'll be able to download your assets zip file after the definition is submitted.
        </p>
        <br />
        {feature}
        <p>
          <b>Advanced mode: </b>
          <a onClick={onDryRun}>Manually boot</a> your own cluster. Validate configuration, generate assets, but don't create the cluster.
        </p>
        <div className={errorClasses}>
          {errorMessage}
        </div>
        {pager}
      </div>
    );
  }
});

SubmitDefinition.canNavigateForward = ({cluster}) => {
  return cluster.ready;
};
