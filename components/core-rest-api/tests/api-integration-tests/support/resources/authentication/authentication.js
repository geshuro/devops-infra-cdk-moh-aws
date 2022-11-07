/* eslint-disable @typescript-eslint/no-var-requires */
const { ResourceNode } = require('@aws-ee/api-testing-framework');

const { AuthenticationStatusNode } = require('./authentication-status');

class AuthenticationNode extends ResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'authentication',
    });
    this.api = '/api/authentication';
  }

  get status() {
    return new AuthenticationStatusNode({ clientSession: this.clientSession, parent: this });
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new AuthenticationNode({ clientSession });
  registry.set('authentication', node);
}

module.exports = { registerResources, AuthenticationNode };
