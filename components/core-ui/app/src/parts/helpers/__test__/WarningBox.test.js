import React from 'react';
import renderer from 'react-test-renderer';
import WarningBox from '../WarningBox';

describe('WarningBox', () => {
  it('renders correctly', () => expect(renderer.create(<WarningBox />).toJSON()).toMatchSnapshot());
});
