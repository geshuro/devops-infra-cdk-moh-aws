/* eslint-disable @typescript-eslint/no-var-requires */
const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');
const { deleteScreening } = require('../../complex/delete-screening');
const { EvidenceTableResourceNode } = require('../screening/evidence-table');
const { SummaryResourceNode } = require('../screening/summary');
const { UploadUrlResourceNode } = require('../screening/upload-url');
const { PhaseCompleteResourceNode } = require('../screening/phase-complete');
const { DecisionResourceNode } = require('../screening/decision/decision');
const { AutoRejectedResourceNode } = require('../screening/auto/autoRejected');
const { AutoApprovedResourceNode } = require('../screening/auto/autoApproved');
const { ArticleResourceNode } = require('../article/article');

/** Screening resource node, used by ScreeningsNode */
class ScreeningNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'screening',
      id,
      parent,
    });

    this.api = `/api/screening/${id}`;
    this.articles = [];

    const childParams = { clientSession, parent: this, screeningId: this.id };

    this.evidenceTable = new EvidenceTableResourceNode(childParams);
    this.uploadUrl = new UploadUrlResourceNode(childParams);

    this.summary1 = new SummaryResourceNode({
      ...childParams,
      screeningStage: 'first',
    });
    this.summary2 = new SummaryResourceNode({
      ...childParams,
      screeningStage: 'second',
    });
    this.autoApproved = new AutoApprovedResourceNode({
      ...childParams,
      screeningStage: 'first',
    });
    this.autoRejected = new AutoRejectedResourceNode({
      ...childParams,
      screeningStage: 'first',
    });
    this.secondAutoApproved = new AutoApprovedResourceNode({
      ...childParams,
      screeningStage: 'second',
    });
    this.secondAutoRejected = new AutoRejectedResourceNode({
      ...childParams,
      screeningStage: 'second',
    });
    // refers to completion of first screening
    this.phase1Complete = new PhaseCompleteResourceNode({ ...childParams, phase: 1 });
    // refers to completion of second screening
    this.phase2Complete = new PhaseCompleteResourceNode({ ...childParams, phase: 2 });

    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [screening]');
  }

  /**
   * this is NOT an API, just a helper,
   * so there's no way to fetch a single article
   */
  article(articleId) {
    const article = new ArticleResourceNode({
      clientSession: this.clientSession,
      parent: this,

      screeningId: this.id,
      id: articleId,
    });
    this.articles.push(article);
    return article;
  }

  decision(decision, articleId) {
    return new DecisionResourceNode({
      clientSession: this.clientSession,
      parent: this,

      screeningStage: 'first',
      screeningId: this.screeningId,
      decision,
      articleId,
    });
  }

  bulkDecision(decision, query) {
    return new DecisionResourceNode({
      clientSession: this.clientSession,
      parent: this,

      screeningStage: 'first',
      screeningId: this.screeningId,
      decision,
      query,
    });
  }

  secondDecision(decision, articleId) {
    return new DecisionResourceNode({
      clientSession: this.clientSession,
      parent: this,

      screeningStage: 'second',
      screeningId: this.screeningId,
      decision,
      articleId,
    });
  }

  secondBulkDecision(decision, query) {
    return new DecisionResourceNode({
      clientSession: this.clientSession,
      parent: this,

      screeningStage: 'second',
      screeningId: this.screeningId,
      decision,
      query,
    });
  }

  async cleanup() {
    await deleteScreening({ aws: this.setup.aws, id: this.id });
    for (const article of this.articles) {
      await article.delete();
    }
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { ScreeningNode, deleteScreening };
