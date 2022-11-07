import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { Key } from '@aws-cdk/aws-kms';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { KmsKeyRotationChecker } from './key-rotation-checker';

describe('key rotation aspect', () => {
  test('should add a warning message for keys without key rotation', () => {
    // GIVEN
    const stack = new Stack();
    new Key(stack, 'Key');

    // WHEN
    Aspects.of(stack).add(new KmsKeyRotationChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Key/Resource',
          level: 'error',
          message: 'KMS key rotation should be enabled.',
        },
      ]),
    );
  });

  test('should not add an error message for keys with key rotation', () => {
    // GIVEN
    const stack = new Stack();
    new Key(stack, 'Key', { enableKeyRotation: true });

    // WHEN
    Aspects.of(stack).add(new KmsKeyRotationChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
