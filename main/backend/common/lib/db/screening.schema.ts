import { Schema } from 'dynamoose';
import type { ModelDefinition } from 'nestjs-dynamoose';

import { SchemaAttribute } from './types';
import { Screening } from '../models/screening';

const schemaKeys: Record<keyof Screening, SchemaAttribute> = {
  id: {
    type: String,
    hashKey: true,
  },
  createdBy: {
    type: String,
  },
  status: {
    type: String,
  },
  clinicalQuestion: {
    type: String,
  },
  keywords: {
    type: String,
  },
  picoP: {
    type: String,
  },
  picoI: {
    type: String,
  },
  picoC: {
    type: String,
  },
  picoO: {
    type: String,
  },
  picoD: {
    type: String,
  },
  csvMetadataSource: {
    type: String,
  },
};

export const ScreeningModelDefinition: ModelDefinition = {
  name: 'Screenings',
  schema: new Schema(schemaKeys, {
    saveUnknown: false,
    timestamps: true,
  }),
};
