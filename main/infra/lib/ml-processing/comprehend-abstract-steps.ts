import { Construct, Duration } from '@aws-cdk/core';
import { Function, Runtime } from '@aws-cdk/aws-lambda';

import { Bucket } from '@aws-cdk/aws-s3';
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
} from '@aws-cdk/aws-iam';

import { codeFromPkg } from '../utils/path-utils';

interface ComprehendAbstractStepsProps {
  namespace: string;
  metadataS3Bucket: Bucket;
  pdfS3Bucket: Bucket;
  comprehendBucket: Bucket;
  role: Role;
  dbPrefix: string;
}

export class ComprehendAbstractSteps extends Function {
  constructor(readonly scope: Construct, props: ComprehendAbstractStepsProps) {
    super(scope, 'ComprehendLambda', {
      functionName: `${props.namespace}-comprehend`,
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-document-evaluation'),
      handler: 'index.comprehendHandler',
      memorySize: 256,
      timeout: Duration.minutes(15),
      role: props.role,
      environment: {
        APP_DB_PREFIX: props.dbPrefix,
        COMPREHEND_BUCKET: props.comprehendBucket.bucketName,
      },
    });
    const comprehendRole = new Role(scope, 'ComprehendRole', {
      assumedBy: new ServicePrincipal('comprehendmedical.amazonaws.com'),
      inlinePolicies: {
        grantComprehendS3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetObject'],
              resources: [
                `${props.metadataS3Bucket.bucketArn}/*`,
                `${props.pdfS3Bucket.bucketArn}/*`,
              ],
            }),
            new PolicyStatement({
              actions: ['s3:ListBucket'],
              resources: [
                props.metadataS3Bucket.bucketArn,
                props.pdfS3Bucket.bucketArn,
                props.comprehendBucket.bucketArn,
              ],
            }),
            new PolicyStatement({
              actions: ['s3:PutObject'],
              resources: [`${props.comprehendBucket.bucketArn}/*`],
            }),
            new PolicyStatement({
              actions: [
                'kms:DescribeKey',
                'kms:Encrypt',
                // only these 2 seem essential https://aws.amazon.com/premiumsupport/knowledge-center/s3-bucket-access-default-encryption/
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [
                props.metadataS3Bucket.encryptionKey!.keyArn,
                props.pdfS3Bucket.encryptionKey!.keyArn,
                props.comprehendBucket.encryptionKey!.keyArn,
              ],
            }),
          ],
        }),
      },
    });
    this.addEnvironment('COMPREHEND_ROLE', comprehendRole.roleArn);
    this.addEnvironment('COMPREHEND_BUCKET', props.comprehendBucket.bucketName);

    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [comprehendRole.roleArn],
      })
    );

    props.metadataS3Bucket.grantReadWrite(this);
    props.pdfS3Bucket.grantReadWrite(this);
    props.comprehendBucket.grantReadWrite(this);
  }
}
