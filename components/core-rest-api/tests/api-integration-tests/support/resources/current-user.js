/* eslint-disable @typescript-eslint/no-var-requires */
const { ResourceNode } = require('@aws-ee/api-testing-framework');

// The user resource is mounted on two different namespaces: /api/users and /api/user
// The /api/user resource is meant to represent the current user.  This file represents the
// resource node for /api/user. For the /api/users, see the users.js file under the users folder.
class CurrentUserNode extends ResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'currentUser',
    });

    this.api = '/api/user';
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new CurrentUserNode({ clientSession });
  registry.set('currentUser', node);
}

module.exports = { registerResources, CurrentUserNode };
