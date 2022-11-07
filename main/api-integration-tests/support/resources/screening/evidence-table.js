/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

/** Evidence table resource node, used by ScreeningResourceNode */
class EvidenceTableResourceNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'evidenceTable',
      id,
      parent,
    });
    this.api = `${this.parent.api}/${this.type}`;

    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [summary]');
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { EvidenceTableResourceNode };
