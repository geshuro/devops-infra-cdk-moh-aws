import type { SchemaDefinition } from 'dynamoose/dist/Schema';

// dummy function to extract type of SchemaDefinition values
const dummyFn = (v: SchemaDefinition) => v.x;

export type SchemaAttribute = ReturnType<typeof dummyFn>;
