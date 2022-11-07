import { Schema } from 'dynamoose';
import type { ModelDefinition } from 'nestjs-dynamoose';

export interface RevokedAccessKey {
  username: string;
  sig: string;
}

export interface RevokedAccess extends RevokedAccessKey {
  ttl: number;
}

export const RevokedAccessModelDefinition: ModelDefinition = {
  name: 'RevokedAccess',
  schema: new Schema(
    {
      username: {
        type: String,
        hashKey: true,
      },
      sig: {
        type: String,
        rangeKey: true,
      },
      ttl: {
        type: Number,
      },
    },
    {
      saveUnknown: false,
      timestamps: true,
    },
  ),
};
