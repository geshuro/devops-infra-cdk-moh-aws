/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

/** Phase 1 / 2 complete resource node, used by ScreeningResourceNode */
class PhaseCompleteResourceNode extends ResourceNode {
  constructor({ phase, clientSession, id, parent }) {
    super({
      clientSession,
      type: `phase${phase}Complete`,
      id,
      parent,
    });
    this.api = `${this.parent.api}/${this.type}`;

    if (_.isEmpty(parent)) throw Error(`A parent resource was not provided to resource type [${this.type}]`);
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { PhaseCompleteResourceNode };
