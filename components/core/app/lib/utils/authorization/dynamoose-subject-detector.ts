export type DynamooseTypeMap = Record<string, new () => any>;

export interface DynamooseSubjectDetectorProps {
  mappings: DynamooseTypeMap;
}

/**
 * Detects the CASL Subject type from objects that have been returned from dynamodb.
 *
 * @returns A detector function to be used in the CASL build method.
 */
export const dynamooseSubjectDetector = (props: DynamooseSubjectDetectorProps) => (item: any) =>
  props.mappings[item.constructor?.originalName] ?? item.constructor;
