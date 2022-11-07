/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

const { deleteUser } = require('../../complex/delete-user');

class UserNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'user',
      id,
      parent,
    });

    // The user resource node is mounted on two different namespaces: /api/users and /api/user
    // The /api/user resource is meant to represent the current user.  This file represents the
    // resource node for /api/users/<user>.
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [user]');
  }

  async cleanup() {
    await deleteUser({ aws: this.setup.aws, id: this.id });
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { UserNode };
