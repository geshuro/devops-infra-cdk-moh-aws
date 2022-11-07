/* eslint-disable @typescript-eslint/no-var-requires */
const { CollectionResourceNode } = require('@aws-ee/api-testing-framework');

const { UserNode } = require('./user');

class UsersNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'users',
      childType: 'user',
      childIdProp: 'uid',
    });

    this.api = '/api/users';
  }

  // Because Users is a collection resource node, it is assumed that accessing the resource node of the
  // child resource is done by calling user(id). For example, the full access pattern to get hold of the
  // resource helper of the child resource is: session.resources.users.user(<id>)
  user(id) {
    return new UserNode({ clientSession: this.clientSession, id, parent: this });
  }

  // When creating a child resource, this method provides default values. This method is used by the
  // CollectionResource class when we use create() method on this resource operations helper.
  defaults(user = {}) {
    const gen = this.setup.gen;
    const username = user.username || gen.username();
    return {
      email: username,
      temporaryPassword: gen.password(),
      firstName: gen.firstName(),
      lastName: gen.lastName(),
      enabled: true,
      userRoles: ['guest'],
      ...user,
    };
  }

  // ************************ Helpers methods ************************

  async deactivateUser(user) {
    const resource = new UserNode({ clientSession: this.clientSession, id: user.uid, parent: this });
    return resource.update({ enabled: false });
  }
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new UsersNode({ clientSession });
  registry.set('users', node);
}

module.exports = { registerResources, UsersNode };
