import React from 'react';
import { shallow } from 'enzyme';

import UsersList from '../UsersList';

jest.mock('../../../helpers/notification');
const notifyMock = require('../../../helpers/notification');

jest.mock('../../../helpers/routing');
const routingMock = require('../../../helpers/routing');

const usersStore = { list: [], load: jest.fn(), startHeartbeat: jest.fn(), stopHeartbeat: jest.fn() };
const userStore = {};

describe('UsersList', () => {
  let component = null;
  let wrapper = null;
  const goto = jest.fn();
  beforeEach(() => {
    // mock functions
    routingMock.gotoFn = jest.fn(() => {
      return goto;
    });
    notifyMock.displayError = jest.fn(x => x);

    // Render component
    wrapper = shallow(<UsersList.WrappedComponent usersStore={usersStore} userStore={userStore} />);

    // Get instance of the component
    component = wrapper.instance();
  });

  it('should handle goto addusers page', async () => {
    // BUILD
    // OPERATE
    component.handleAddUser();
    // CHECK
    expect(goto).toHaveBeenCalledWith('/users/add');
  });

  it('should handle goto authenticationProvider page', async () => {
    // BUILD
    // OPERATE
    component.handleAddAuthenticationProvider();
    // CHECK
    expect(goto).toHaveBeenCalledWith('/authentication-providers');
  });
});
