import { logger } from '@aws-ee/common';
import { CfnElement, IConstruct, Stack } from '@aws-cdk/core';

/**
 * Sets the logical ID of a CDK construct. This is useful if the construct needs to be found by name,
 * for example when it is run locally via SAM.
 *
 * @param construct The construct that gets the changed ID
 * @param logicalId The new ID
 */
export function setLogicalId(construct: IConstruct | undefined, logicalId: string): void {
  if (!construct) {
    logger.warn(`Cannot set logical ID "${logicalId}" for undefined construct`);
    return;
  }
  let cfnElement;
  if (construct instanceof CfnElement) {
    cfnElement = construct;
  } else if (construct.node.defaultChild instanceof CfnElement) {
    cfnElement = construct.node.defaultChild;
  }
  if (!cfnElement) {
    logger.warn(`Cannot find default child in construct ${construct.node.path}`);
    return;
  }

  const stack = Stack.of(construct);

  const currentLogicalId = stack.getLogicalId(cfnElement);
  stack.renameLogicalId(currentLogicalId, logicalId);
}
