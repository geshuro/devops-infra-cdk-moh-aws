import React from 'react';
import renderer from 'react-test-renderer';
import Component from '../Age';

describe('Age', () => {
  it('renders correctly', () => expect(renderer.create(<Component date="1234" />).toJSON()).toMatchSnapshot());
});
