import * as path from 'path';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { BlockPublicAccess, Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { Key } from '@aws-cdk/aws-kms';

import { CoreStage, CoreConfig, EnvType, Stack, CoreStack } from '@aws-ee/core-infra';
import { PostDeploymentStack } from '@aws-ee/core-post-deployment-infra';

@Injectable()
export class DummyDataStack extends Stack {
  constructor(
    configService: ConfigService,
    coreStack: CoreStack,
    postDeploymentStack: PostDeploymentStack,
    @Inject(CoreStage) stage: Construct,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'dummyData', {
      description: 'Contains resources related to creating and tracking dummy data',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
    const removalPolicy = coreConfig.envType === EnvType.Dev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    const dummyDataKey = new Key(this, 'dummyDataKey', {
      alias: `${coreConfig.globalNamespace}-dummy-data-key`,
      enableKeyRotation: true,
      removalPolicy,
    });

    const dummyDataBucket = new Bucket(this, 'DummyScreeningsBucket', {
      bucketName: `${coreConfig.globalNamespace}-dummy-screenings`,
      encryption: BucketEncryption.KMS,
      encryptionKey: dummyDataKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: coreStack.loggingBucket,
      serverAccessLogsPrefix: 'input-metadata-raw/',
      removalPolicy,
      autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
    });
    dummyDataBucket.grantReadWrite(postDeploymentStack.postDeploymentLambda);

    const screenings = ['gcc_cpp', 'liver_m', 'liver_p', 'prostate_m', 'prostate_p'];
    screenings.forEach(element => {
      const mdAsset = new Asset(this, `${element}md`, {
        path: path.join(__dirname, `fake-screenings/${element}/metadata.csv`)
      });
      postDeploymentStack.postDeploymentLambda
        .addEnvironment(`DUMMY_DATA_ASSETS_${element}_MD`, `/${mdAsset.s3BucketName}/${mdAsset.s3ObjectKey}`!);
      mdAsset.grantRead(postDeploymentStack.postDeploymentLambda);

      const requestAsset = new Asset(this, `${element}request`, {
        path: path.join(__dirname, `fake-screenings/${element}/request.json`)
      });
      postDeploymentStack.postDeploymentLambda
        .addEnvironment(`DUMMY_DATA_ASSETS_${element}_RQ`, `/${requestAsset.s3BucketName}/${requestAsset.s3ObjectKey}`!);
      requestAsset.grantRead(postDeploymentStack.postDeploymentLambda);
    });
    
    const journalPdfAsset = new Asset(this, `pdf-article`, {
      path: path.join(__dirname, `dummy-pdfs/random-journal.pdf`)
    });
    postDeploymentStack.postDeploymentLambda
      .addEnvironment(`DUMMY_DATA_ASSETS_PDF`, `/${journalPdfAsset.s3BucketName}/${journalPdfAsset.s3ObjectKey}`!);
    journalPdfAsset.grantRead(postDeploymentStack.postDeploymentLambda);

    postDeploymentStack.postDeploymentLambda
      .addEnvironment('DUMMY_DATA_BUCKET', dummyDataBucket.bucketName!);
  }
}
