/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

class AuthenticationStatusNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'status',
      id,
      parent,
    });

    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [status]');

    this.api = `${parent.api}/${this.type}`;
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { AuthenticationStatusNode };
