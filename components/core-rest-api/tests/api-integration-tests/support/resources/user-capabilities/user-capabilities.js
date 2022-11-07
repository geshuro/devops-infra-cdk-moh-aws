/* eslint-disable @typescript-eslint/no-var-requires */
const { CollectionResourceNode } = require('@aws-ee/api-testing-framework');

class UserCapabilitiesNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'user-capabilities',
    });

    this.api = '/api/user-capabilities';
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new UserCapabilitiesNode({ clientSession });
  registry.set('userCapabilities', node);
}

module.exports = { registerResources, UserCapabilitiesNode };
