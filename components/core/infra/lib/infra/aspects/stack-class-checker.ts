import { Annotations, IAspect, IConstruct, Stack as CdkStack } from '@aws-cdk/core';
import { Stack } from '../util/ee-stack';

export class StackClassChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CdkStack && !(node instanceof Stack)) {
      Annotations.of(node).addError('All stacks must inherit from Stack which is imported from @aws-ee/core-infra.');
    }
  }
}
