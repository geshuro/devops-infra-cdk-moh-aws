import React from 'react';
import renderer from 'react-test-renderer';
import Component from '../BasicProgressPlaceholder';

describe('BasicProgressPlaceholder', () => {
  it('renders correctly', () => expect(renderer.create(<Component />).toJSON()).toMatchSnapshot());
});
