import React from 'react';
import renderer from 'react-test-renderer';
import Component from '../Progress';

describe('Progress', () => {
  it('renders correctly', () => expect(renderer.create(<Component />).toJSON()).toMatchSnapshot());
});
