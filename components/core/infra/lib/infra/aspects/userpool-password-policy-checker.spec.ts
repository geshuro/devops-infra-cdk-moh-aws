import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { UserPool } from '@aws-cdk/aws-cognito';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { UserPoolPasswordPolicyChecker } from './userpool-password-policy-checker';

describe('user pool password policy aspect', () => {
  test('should add an error message for user pools without password policy', () => {
    // GIVEN
    const stack = new Stack();
    new UserPool(stack, 'UserPool');

    // WHEN
    Aspects.of(stack).add(new UserPoolPasswordPolicyChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/UserPool/Resource',
          level: 'warning',
          message: 'User pool should have a password policy.',
        },
      ]),
    );
  });

  test('should not add an error message for user pools with password policy', () => {
    // GIVEN
    const stack = new Stack();
    new UserPool(stack, 'UserPool', {
      passwordPolicy: {
        minLength: 8,
      },
    });

    // WHEN
    Aspects.of(stack).add(new UserPoolPasswordPolicyChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
