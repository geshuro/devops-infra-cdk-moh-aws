import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnStage } from '@aws-cdk/aws-apigateway';

export class ApiLoggingChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnStage) {
      if (!node.accessLogSetting) {
        Annotations.of(node).addWarning('API stage logging should be enabled.');
      }
    }
  }
}
