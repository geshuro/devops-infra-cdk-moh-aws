import { Annotations, IAspect, IConstruct, Tokenization } from '@aws-cdk/core';
import { CfnDistribution } from '@aws-cdk/aws-cloudfront';

export class DistributionWebAclChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnDistribution) {
      if (!isDistributionWebAclEnabled(node)) {
        Annotations.of(node).addError('Distribution web ACL should be set.');
      }
    }
  }
}

function isDistributionWebAclEnabled(pool: CfnDistribution): boolean {
  const { distributionConfig } = pool;
  if (Tokenization.isResolvable(distributionConfig)) {
    // If distributionConfig is a token then we cannot check if web ACL is enabled and we just return true
    return true;
  }
  return !!distributionConfig.webAclId;
}
