import React from 'react';
import renderer from 'react-test-renderer';
import UserLabels from '../UserLabels';

describe('UserLabels', () => {
  it('renders correctly', () =>
    expect(renderer.create(<UserLabels users={[{ username: 'username' }]} />).toJSON()).toMatchSnapshot());
});
