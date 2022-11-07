import { Construct, RemovalPolicy, Duration } from '@aws-cdk/core';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  EventType,
  HttpMethods,
} from '@aws-cdk/aws-s3';
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications';
import { Key } from '@aws-cdk/aws-kms';
import { Table } from '@aws-cdk/aws-dynamodb';
import { Runtime, Function } from '@aws-cdk/aws-lambda';

import { codeFromPkg } from '../utils/path-utils';

interface DocumentInputProps {
  namespace: string;
  dbPrefix: string;
  removalPolicy: RemovalPolicy;
  loggingBucket: Bucket;
  articleTable: Table;
  screeningsTable: Table;
  websiteUrl: string;
}

export class DocumentInput {
  public readonly rawMetadataBucket: Bucket;
  public readonly processedMetadata: Bucket;
  public readonly rawPdfBucket: Bucket;
  public readonly processedPdf: Bucket;

  constructor(readonly scope: Construct, props: DocumentInputProps) {
    const inputKey = new Key(scope, 'inputKey', {
      alias: `${props.namespace}-input-documents-key`,
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy,
    });

    this.rawMetadataBucket = new Bucket(scope, 'RawMetadataBucket', {
      bucketName: `${props.namespace}-raw-metadata`,
      encryption: BucketEncryption.KMS,
      encryptionKey: inputKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 'input-metadata-raw/',
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: props.removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
      cors: [
        {
          allowedMethods: [HttpMethods.HEAD, HttpMethods.POST],
          allowedOrigins: [
            'http://localhost:3000',
            props.websiteUrl
              ? new URL(props.websiteUrl).origin
              : props.websiteUrl,
          ],
        },
      ],
    });

    this.processedMetadata = new Bucket(scope, 'ProcessedMetadataBucket', {
      bucketName: `${props.namespace}-proc-metadata`,
      encryption: BucketEncryption.KMS,
      encryptionKey: inputKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 'input-metadata-proc/',
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: props.removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
    });

    this.rawPdfBucket = new Bucket(scope, 'RawPdfBucket', {
      bucketName: `${props.namespace}-raw-pdf`,
      encryption: BucketEncryption.KMS,
      encryptionKey: inputKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 'input-pdf-raw/',
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: props.removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
      cors: [
        {
          allowedMethods: [HttpMethods.HEAD, HttpMethods.POST],
          allowedOrigins: ['localhost', props.websiteUrl],
        },
      ],
    });

    this.processedPdf = new Bucket(scope, 'ProcessedPdfBucket', {
      bucketName: `${props.namespace}-proc-pdf`,
      encryption: BucketEncryption.KMS,
      encryptionKey: inputKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 'input-pdf-proc/',
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: props.removalPolicy === RemovalPolicy.DESTROY,
      versioned: true,
    });

    const processLambda = new Function(
      scope,
      `ProcessMetadata${props.namespace}`,
      {
        functionName: `${props.namespace}-process-metadata`,
        description:
          'Processes input raw metadata into a structure that downstream processes can read.',
        runtime: Runtime.NODEJS_14_X,
        code: codeFromPkg('@aws-ee/backend-screening-input'),
        handler: 'index.processMetadataHandler',
        memorySize: 512,
        timeout: Duration.minutes(15),
        environment: {
          RAW_METADATA_BUCKET: this.rawMetadataBucket.bucketName!,
          PROCESSED_METADATA_BUCKET: this.processedMetadata.bucketName!,
          APP_DB_PREFIX: props.dbPrefix,
          RAW_PDF_BUCKET: this.rawPdfBucket.bucketName!,
          PROCESSED_PDF_BUCKET: this.processedPdf.bucketName!,
        },
      }
    );

    const processPdfLambda = new Function(
      scope,
      `ProcessPdf${props.namespace}`,
      {
        functionName: `${props.namespace}-process-pdf`,
        description:
          'Processes input raw pdfs into text files that downstream processes can read.',
        runtime: Runtime.NODEJS_14_X,
        code: codeFromPkg('@aws-ee/backend-screening-input'),
        handler: 'index.processPdfHandler',
        memorySize: 512,
        timeout: Duration.minutes(15),
        environment: {
          RAW_PDF_BUCKET: this.rawPdfBucket.bucketName!,
          PROCESSED_PDF_BUCKET: this.processedPdf.bucketName!,
          APP_DB_PREFIX: props.dbPrefix,
        },
      }
    );

    this.rawMetadataBucket.grantRead(processLambda);
    this.processedMetadata.grantReadWrite(processLambda);
    props.articleTable.grant(processLambda, 'dynamodb:DescribeTable'); // Needed for DynaMoose
    props.articleTable.grantReadWriteData(processLambda);
    props.screeningsTable.grant(processLambda, 'dynamodb:DescribeTable'); // Needed for DynaMoose
    props.screeningsTable.grantReadWriteData(processLambda);

    this.rawMetadataBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(processLambda)
    );

    this.rawPdfBucket.grantRead(processPdfLambda);
    this.processedPdf.grantReadWrite(processPdfLambda);

    props.articleTable.grant(processPdfLambda, 'dynamodb:DescribeTable'); // Needed for DynaMoose
    props.articleTable.grantReadWriteData(processPdfLambda);
    props.screeningsTable.grant(processPdfLambda, 'dynamodb:DescribeTable'); // Needed for DynaMoose
    props.screeningsTable.grantReadWriteData(processPdfLambda);
  }
}
