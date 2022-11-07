/* eslint-disable @typescript-eslint/no-var-requires */
const { CollectionResourceNode } = require('@aws-ee/api-testing-framework');

class UserRolesNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'user-roles',
    });

    this.api = '/api/user-roles';
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new UserRolesNode({ clientSession });
  registry.set('userRoles', node);
}

module.exports = { registerResources, UserRolesNode };
