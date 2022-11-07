import { Schema } from 'dynamoose';
import type { ModelDefinition } from 'nestjs-dynamoose';

export const DeploymentItemModelDefinition: ModelDefinition = {
  name: 'DeploymentStore',
  schema: new Schema({
    type: {
      type: String,
      hashKey: true,
    },
    id: {
      type: String,
      rangeKey: true,
    },
    value: {
      type: String,
    },
  }),
};
