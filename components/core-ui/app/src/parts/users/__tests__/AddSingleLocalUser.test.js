import React from 'react';
import { shallow } from 'enzyme';
import AddSingleCognitoUser from '../AddSingleCognitoUser';

jest.mock('../../../helpers/notification');
const notifyMock = require('../../../helpers/notification');

const usersStore = {
  load: jest.fn(),
};

const userRolesStore = {
  dropdownOptions: jest.fn(),
};

const authenticationProviderConfigsStore = {
  cognitoAuthProvider: {
    id: 'mockProviderId',
  },
};

class TestForm {
  constructor() {
    this.user = null;
  }

  setValues(user) {
    this.user = user;
  }

  values() {
    return this.user;
  }

  clear() {}
}

describe('AddSingleCognitoUser', () => {
  let component = null;
  let wrapper = null;
  beforeEach(() => {
    // Render component
    wrapper = shallow(
      <AddSingleCognitoUser.WrappedComponent
        usersStore={usersStore}
        userRolesStore={userRolesStore}
        authenticationProviderConfigsStore={authenticationProviderConfigsStore}
      />,
    );

    // Get instance of the component
    component = wrapper.instance();

    // mock functions
    component.componentDidMount();
    component.gotoUsersList = jest.fn();
    notifyMock.displayError = jest.fn((x) => x);
  });

  it('should fail because the store threw an error', async () => {
    // BUILD
    const user = {
      email: 'mscott@example.com',
      firstName: 'Michael',
      lastName: 'Scarn',
      userRoles: ['admin'],
    };
    const error = { message: 'cannot add user' };
    usersStore.addUser = jest.fn(() => {
      throw error;
    });

    const curForm = new TestForm();
    curForm.setValues(user);
    // OPERATE
    await component.handleFormSubmission(curForm);

    // CHECK
    expect(usersStore.addUser).toHaveBeenCalledWith({
      ...user,
      username: user.email,
      authenticationProviderId: 'mockProviderId',
    });
    expect(notifyMock.displayError).toHaveBeenCalledWith(error);
  });

  it('should add the user', async () => {
    // BUILD
    component.gotoUsersList = jest.fn();
    wrapper.update();
    const user = {
      email: 'jhalpert@example.com',
      firstName: 'Jim',
      lastName: 'Halpert',
      userRoles: ['admin'],
    };
    usersStore.addUser = jest.fn();

    const curForm = new TestForm();
    curForm.setValues(user);

    // OPERATE
    await component.handleFormSubmission(curForm);

    // CHECK
    expect(usersStore.addUser).toHaveBeenCalledWith({
      ...user,
      username: user.email,
      authenticationProviderId: 'mockProviderId',
    });
    expect(component.gotoUsersList).toHaveBeenCalled();
    expect(notifyMock.displayError).not.toHaveBeenCalled();
  });
});
