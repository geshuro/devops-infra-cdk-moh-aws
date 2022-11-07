import { Annotations, IAspect, IConstruct, Token } from '@aws-cdk/core';
import { CfnUserPool } from '@aws-cdk/aws-cognito';

export class UserPoolPasswordPolicyChecker implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnUserPool) {
      if (!isUserPoolPasswordPolicySet(node)) {
        Annotations.of(node).addWarning('User pool should have a password policy.');
      }
    }
  }
}

function isUserPoolPasswordPolicySet(pool: CfnUserPool) {
  const { policies } = pool;
  if (!policies) {
    return false;
  }
  if (Token.isUnresolved(policies)) {
    // If policies is a token then we cannot check if password policy is enabled and just return true
    return true;
  }
  if ('passwordPolicy' in policies) {
    // If status is a token then we cannot check if versioning is enabled and just return true
    return Token.isUnresolved(policies.passwordPolicy) || !!policies.passwordPolicy;
  }
  return false;
}
