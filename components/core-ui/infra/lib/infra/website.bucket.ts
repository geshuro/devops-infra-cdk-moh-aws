import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { BlockPublicAccess, Bucket, BucketEncryption, BucketProps } from '@aws-cdk/aws-s3';

export interface WebsiteBucketProps {
  name: string;
  enableS3Hosting: boolean;
  loggingBucket: Bucket;
}

export class WebsiteBucket extends Bucket {
  constructor(scope: Construct, props: WebsiteBucketProps) {
    const hostingOpts: Partial<BucketProps> = props.enableS3Hosting
      ? {
          websiteIndexDocument: 'index.html',
          websiteErrorDocument: 'index.html',
        }
      : {};
    super(scope, 'WebsiteBucket', {
      bucketName: props.name,
      encryption: BucketEncryption.S3_MANAGED,
      //         SSEAlgorithm: AES256
      ...hostingOpts,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 'website-logs/',
    });
  }
}
