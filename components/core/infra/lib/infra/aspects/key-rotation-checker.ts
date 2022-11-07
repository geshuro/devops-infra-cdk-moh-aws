import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnKey } from '@aws-cdk/aws-kms';

export class KmsKeyRotationChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnKey) {
      if (!node.enableKeyRotation) {
        Annotations.of(node).addError('KMS key rotation should be enabled.');
      }
    }
  }
}
