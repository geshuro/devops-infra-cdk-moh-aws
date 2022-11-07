import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnBucket, Bucket } from '@aws-cdk/aws-s3';
import { AnyPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam';

import { checkResolvable } from '../util/check-resolvable';

export interface S3RulesProps {
  isDevelopmentEnv: boolean;
}

export class S3Rules implements IAspect {
  constructor(private props: S3RulesProps) {}

  visit(node: IConstruct): void {
    if (node instanceof CfnBucket) {
      this.checkLoggingEnabled(node);
      this.checkBucketEncryption(node);
      this.checkBucketVersioning(node);
    }
    if (node instanceof Bucket) {
      this.applyBucketResourcePolicies(node);
    }
  }

  private checkLoggingEnabled(bucket: CfnBucket) {
    checkResolvable({
      resource: bucket,
      config: bucket.loggingConfiguration,
      message: 'Bucket server access logging should be enabled.',
      severity: this.props.isDevelopmentEnv ? 'warning' : 'error',
      passCondition: (loggingConf) => !!loggingConf,
    });
  }

  private checkBucketEncryption(bucket: CfnBucket) {
    if (!bucket.bucketEncryption) {
      Annotations.of(bucket).addError('Bucket encryption should be enabled.');
    }
  }

  private checkBucketVersioning(bucket: CfnBucket): void {
    checkResolvable({
      resource: bucket,
      config: bucket.versioningConfiguration,
      message: 'Bucket is not versioned. Consider enabling this if the bucket contains critical data.',
      severity: 'info',
      passCondition: (versionConf) => versionConf?.status === 'Enabled',
    });
  }

  /**
   * Adds resource policies to all solution buckets:
   * - Deny requests that do not use TLS
   * - Deny requests that do not use SigV4
   */

  private applyBucketResourcePolicies(bucket: Bucket): void {
    bucket.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Deny requests that do not use TLS',
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      }),
    );

    bucket.addToResourcePolicy(
      new PolicyStatement({
        sid: 'Deny requests that do not use SigV4',
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:signatureversion': 'AWS4-HMAC-SHA256',
          },
        },
      }),
    );
  }
}
