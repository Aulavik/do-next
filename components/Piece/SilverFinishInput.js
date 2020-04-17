import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select, InputLabel, FormControl } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

import Error from '../Error/Error';

const styles = {
  inputRoot: {
    fontSize: '14px',
  },
  labelRoot: {
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.87)',
  },
  formControl: {
    maxWidth: '11rem',
    width: '100%',
  },
};

const SilverFinishInput = ({ error, errorText, handleChange, classes }) => {
  const [silverFinish, setSilverFinish] = useState('');
  const [silverFinishError, setSilverFinishError] = useState(true);

  const changeSilverFinish = (e) => {
    const { value } = e.target;
    setSilverFinish(value);
    if (value) {
      setSilverFinishError(false);
    } else {
      setSilverFinishError(true);
    }
    handleChange(e);
  };

  return (
    <FormControl
      error={error && silverFinishError}
      classes={{ root: classes.formControl }}
    >
      <InputLabel
        htmlFor="silverFinish-native"
        classes={{ root: classes.labelRoot }}
      >
        Choose silver finish
      </InputLabel>
      <Select
        native
        value={silverFinish}
        onChange={changeSilverFinish}
        inputProps={{
          name: 'silverFinish',
          id: 'silverFinish-native',
          classes: {
            root: classes.inputRoot,
          },
        }}
      >
        <option value="" aria-label="default blank" />
        <option value="regular">regular (white)</option>
        <option value="oxidized">oxidized (black)</option>
      </Select>
      {error && silverFinishError && <Error>{errorText}</Error>}
    </FormControl>
  );
};

SilverFinishInput.propTypes = {
  error: PropTypes.bool,
  errorText: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SilverFinishInput);