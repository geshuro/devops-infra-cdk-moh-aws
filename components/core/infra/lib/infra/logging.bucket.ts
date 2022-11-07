import { Construct, Duration, RemovalPolicy } from '@aws-cdk/core';
import { PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { BlockPublicAccess, Bucket, BucketProps, BucketAccessControl, BucketEncryption } from '@aws-cdk/aws-s3';
import { EnvType } from '../config/core-stage-config';

export interface LoggingBucketProps {
  name: string;
  cloudTrailLogsBucketPrefix: string;
  envType: EnvType;
}

export class LoggingBucket extends Bucket {
  constructor(scope: Construct, private props: LoggingBucketProps) {
    super(scope, 'LoggingBucket', {
      bucketName: props.name,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'CloudTrail Expiration Rule',
          prefix: props.cloudTrailLogsBucketPrefix,
          enabled: true,
          expiration: Duration.days(2),
        },
      ],
      ...envDependentProps(props.envType),
    });
    this.constructResourcePolicy();
  }

  private constructResourcePolicy() {
    this.addToResourcePolicy(
      new PolicyStatement({
        sid: 'AWS CloudTrail Acl Check',
        principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [this.bucketArn],
      }),
    );

    this.addToResourcePolicy(
      new PolicyStatement({
        sid: 'AWS CloudTrail Write',
        principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${this.bucketArn}/${this.props.cloudTrailLogsBucketPrefix}*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      }),
    );
  }
}

/**
 * In DEV:
 *  - The bucket will be auto-destroyed
 *  - The bucket does not log access to itself to ensure that it can be destroyed cleanly
 *
 * In DEMO/PROD:
 *  - The bucket logs accesses to itself
 *  - The bucket has to be deleted manually when the solution is destroyed
 *  - The access logging to itself prevents the deletion, so in order to
 *    destroy the bucket you must first manually disable access logging
 */
const envDependentProps = (envType: EnvType): Partial<BucketProps> =>
  envType === EnvType.Dev
    ? {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    : {
        serverAccessLogsPrefix: 'logging-logs/',
        removalPolicy: RemovalPolicy.RETAIN,
      };
