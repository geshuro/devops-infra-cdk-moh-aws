import React from 'react';
import renderer from 'react-test-renderer';
import ErrorBox from '../ErrorBox';

describe('ErrorBox', () => {
  it('renders correctly', () => expect(renderer.create(<ErrorBox />).toJSON()).toMatchSnapshot());
});
