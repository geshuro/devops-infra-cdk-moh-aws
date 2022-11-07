import type { IBucket } from '@aws-cdk/aws-s3';
import type { IDistribution } from '@aws-cdk/aws-cloudfront';
import { BucketDeployment, ISource } from '@aws-cdk/aws-s3-deployment';
import type { Construct } from '@aws-cdk/core';

export interface WebsiteDeploymentProps {
  websiteBucket: IBucket;
  sources: ISource;
  distribution?: IDistribution;
}

export class WebsiteDeployment extends BucketDeployment {
  constructor(scope: Construct, props: WebsiteDeploymentProps) {
    super(scope, 'WebsiteBucketDeploy', {
      sources: [props.sources],
      destinationBucket: props.websiteBucket,
      distribution: props.distribution,
    });
  }
}
