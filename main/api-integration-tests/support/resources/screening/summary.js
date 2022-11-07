/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

/** Summary resource node, used by ScreeningResourceNode */
class SummaryResourceNode extends ResourceNode {
  constructor({ clientSession, id, parent, screeningStage }) {
    super({
      clientSession,
      type: 'summary',
      id,
      parent,
    });
    if (screeningStage === 'first') {
      this.api = `${this.parent.api}/${this.type}1`;
    } else if (screeningStage === 'second') {
      this.api = `${this.parent.api}/${this.type}2`;
    } else {
      throw new Error(`unknown screeningStage '${screeningStage}'`);
    }

    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [summary]');
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { SummaryResourceNode };
