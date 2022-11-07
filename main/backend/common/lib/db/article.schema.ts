import { Schema } from 'dynamoose';
import type { ModelDefinition } from 'nestjs-dynamoose';

import { SchemaAttribute } from './types';
import { Article } from '../models/article';

const schemaKeys: Record<keyof Omit<Article, 'createdAt'>, SchemaAttribute> = {
  id: {
    type: String,
    hashKey: true,
  },
  firstAutoReviewDecision: {
    type: String,
  },
  secondAutoReviewDecision: {
    type: String,
  },
  title: {
    type: String,
  },
  author: {
    type: String,
  },
  abstract: {
    type: String,
  },
  screeningId: {
    type: String,
    index: {
      name: 'ScreeningIdIndex',
      global: false
    }
  },
  source: {
    type: String,
  },
  picoPScore: {
    type: Number,
  },
  picoIScore: {
    type: Number,
  },
  picoCScore: {
    type: Number,
  },
  picoOScore: {
    type: Number,
  },
  picoDScore: {
    type: Number,
  },
  secondPicoPScore: {
    type: Number,
  },
  secondPicoIScore: {
    type: Number,
  },
  secondPicoCScore: {
    type: Number,
  },
  secondPicoOScore: {
    type: Number,
  },
  secondPicoDScore: {
    type: Number,
  },
  firstAvgPico: {
    type: Number,
  },
  secondAvgPico: {
    type: Number,
  },
  metadataSource: {
    type: String,
  },
  decisions: {
    type: Array,
    schema: [Object],
  },
  secondDecisions: {
    type: Array,
    schema: [Object],
  },
  firstDecisionSummary: {
    type: String,
  },
  secondDecisionSummary: {
    type: String,
  }
};

export const ArticleModelDefinition: ModelDefinition = {
  name: 'Article',
  schema: new Schema(schemaKeys, {
    saveUnknown: ['decisions.**', 'secondDecisions.**'],
    timestamps: true,
  }),
  // TODO: add secondary index metadata, so Dynamoose is efficient at querying by screeningId if needed
};
