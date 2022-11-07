import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack, Lazy } from '@aws-cdk/core';
import { Bucket, CfnBucket } from '@aws-cdk/aws-s3';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { S3Rules } from './s3-rules';
import { EnvType } from '../../config/core-stage-config';

describe('S3 rules', () => {
  it.each`
    envType         | level
    ${EnvType.Dev}  | ${'warning'}
    ${EnvType.Demo} | ${'error'}
    ${EnvType.Prod} | ${'error'}
  `('should add a $level message for buckets that do not have logging in $envType', ({ envType, level }) => {
    // GIVEN
    const stack = new Stack();
    new Bucket(stack, 'Bucket');

    // WHEN
    Aspects.of(stack).add(new S3Rules({ isDevelopmentEnv: envType === EnvType.Dev }));

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Bucket/Resource',
          level,
          message: 'Bucket server access logging should be enabled.',
        },
      ]),
    );
  });

  it.each`
    envType
    ${EnvType.Dev}
    ${EnvType.Demo}
    ${EnvType.Prod}
  `('should add an error message for buckets that are not encrypted in $envType', ({ envType }) => {
    // GIVEN
    const stack = new Stack();
    new Bucket(stack, 'Bucket');

    // WHEN
    Aspects.of(stack).add(new S3Rules({ isDevelopmentEnv: envType === EnvType.Dev }));

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Bucket/Resource',
          level: 'error',
          message: 'Bucket encryption should be enabled.',
        },
      ]),
    );
  });

  it.each`
    envType
    ${EnvType.Dev}
    ${EnvType.Demo}
    ${EnvType.Prod}
  `('should add an error message for buckets that are not versioned in $envType', ({ envType }) => {
    // GIVEN
    const stack = new Stack();
    new Bucket(stack, 'Bucket');
    new CfnBucket(stack, 'BucketExplicitlyDisabled', {
      versioningConfiguration: {
        status: 'Disabled',
      },
    });

    // WHEN
    Aspects.of(stack).add(new S3Rules({ isDevelopmentEnv: envType === EnvType.Dev }));

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Bucket/Resource',
          level: 'info',
          message: 'Bucket is not versioned. Consider enabling this if the bucket contains critical data.',
        },
        {
          id: '/Default/BucketExplicitlyDisabled',
          level: 'info',
          message: 'Bucket is not versioned. Consider enabling this if the bucket contains critical data.',
        },
      ]),
    );
  });

  it.each`
    envType
    ${EnvType.Dev}
    ${EnvType.Demo}
    ${EnvType.Prod}
  `('should not add an error message for versioned buckets in $envType', ({ envType }) => {
    // GIVEN
    const stack = new Stack();
    new Bucket(stack, 'Bucket', {
      versioned: true,
    });
    new CfnBucket(stack, 'BucketWithConfigToken', {
      versioningConfiguration: Lazy.any({ produce: () => ({ status: 'Enabled' }) }),
    });
    new CfnBucket(stack, 'BucketWithStatusToken', {
      versioningConfiguration: {
        status: Lazy.string({ produce: () => 'Enabled' }),
      },
    });

    // WHEN
    Aspects.of(stack).add(new S3Rules({ isDevelopmentEnv: envType === EnvType.Dev }));

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/BucketWithConfigToken',
          level: 'info',
          message:
            'The condition "Bucket is not versioned. Consider enabling this if the bucket contains critical data." could not be verified.',
        },
      ]),
    );
  });
});
