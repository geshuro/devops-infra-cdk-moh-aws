import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnStateMachine } from '@aws-cdk/aws-stepfunctions';

export class StateMachineLoggingChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnStateMachine) {
      if (!node.loggingConfiguration) {
        Annotations.of(node).addWarning('State machine logging should be enabled.');
      }
    }
  }
}
