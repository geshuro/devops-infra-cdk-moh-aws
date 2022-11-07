import { Construct, Duration } from '@aws-cdk/core';
import { Function, Runtime } from '@aws-cdk/aws-lambda';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { LambdaInvoke } from '@aws-cdk/aws-stepfunctions-tasks';
import {
  Choice,
  Condition,
  Map,
  Parallel,
  Fail,
  Wait,
  Chain,
  CustomState,
  WaitTime,
} from '@aws-cdk/aws-stepfunctions';
import { OpenSearchStack } from '@aws-ee/opensearch-api-infra';
import { Table } from '@aws-cdk/aws-dynamodb';
import { Bucket } from '@aws-cdk/aws-s3';

import { codeFromPkg } from '../utils/path-utils';
import { ComprehendAbstractSteps } from './comprehend-abstract-steps';
import { ComprehendQuestionSteps } from './comprehend-question-steps';
import { AddScreeningProps } from './add-screening-props';

interface WorkflowProps {
  metadataS3Bucket: Bucket;
  rawPdfS3Bucket: Bucket;
  processedPdfS3Bucket: Bucket;
  comprehendTermsBucket: Bucket;
  mlResultsBucket: Bucket;
  screeningTable: Table;
  articleTable: Table;
  namespace: string;
  dbPrefix: string;
  openSearchStack: OpenSearchStack;
  accountId: string;
}

export class WorkflowDefinition {
  readonly stateMachine: Chain;
  readonly stateMachineRole: Role;

  constructor(readonly scope: Construct, props: WorkflowProps) {
    this.stateMachineRole = new Role(scope, 'MLProcessRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('ComprehendMedicalFullAccess'),
      ],
    });
    props.screeningTable.grantReadWriteData(this.stateMachineRole);
    props.screeningTable.grant(this.stateMachineRole, 'dynamodb:DescribeTable');

    const getScreeningStatus = new CustomState(scope, 'GetScreeningStatus', {
      stateJson: {
        Type: 'Task',
        Resource: 'arn:aws:states:::dynamodb:getItem',
        Parameters: {
          TableName: props.screeningTable.tableName,
          Key: {
            id: {
              'S.$': '$.screeningId',
            },
          },
        },
      },
    });

    const commonLambdaEnvironment = {
      APP_DB_PREFIX: props.dbPrefix,
      ACCOUNT_ID: props.accountId,
    };

    const metadataInputRole = new Role(scope, 'MetadataInputRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });
    props.articleTable.grantReadWriteData(metadataInputRole);
    props.articleTable.grant(metadataInputRole, 'dynamodb:DescribeTable');
    props.screeningTable.grantReadWriteData(metadataInputRole);
    props.screeningTable.grant(metadataInputRole, 'dynamodb:DescribeTable');
    props.metadataS3Bucket.grantRead(metadataInputRole);
    props.rawPdfS3Bucket.grantRead(metadataInputRole);
    props.processedPdfS3Bucket.grantReadWrite(metadataInputRole);

    const getMetadataJob = new LambdaInvoke(
      scope,
      'Start Screening Phase 1 Job',
      {
        lambdaFunction: new Function(scope, 'start-phase-1', {
          functionName: `${props.namespace}-start-phase-1`,
          code: codeFromPkg('@aws-ee/backend-screening-input'),
          handler: 'index.phase1Handler',
          environment: commonLambdaEnvironment,
          memorySize: 512,
          timeout: Duration.minutes(15),
          runtime: Runtime.NODEJS_14_X,
          role: metadataInputRole,
        }),
        inputPath: '$.Item',
        outputPath: '$.Payload',
      }
    );

    const getFullTextJob = new LambdaInvoke(
      scope,
      'Start Screening Phase 2 Job',
      {
        lambdaFunction: new Function(scope, 'start-phase-2', {
          functionName: `${props.namespace}-start-phase-2`,
          code: codeFromPkg('@aws-ee/backend-screening-input'),
          handler: 'index.phase2Handler',
          environment: {
            ...commonLambdaEnvironment,
            RAW_PDF_BUCKET: props.rawPdfS3Bucket.bucketName!,
            PROCESSED_PDF_BUCKET: props.processedPdfS3Bucket.bucketName!,
          },
          memorySize: 512,
          timeout: Duration.minutes(15),
          runtime: Runtime.NODEJS_14_X,
          role: metadataInputRole,
        }),
        inputPath: '$.Item',
        outputPath: '$.Payload',
      }
    );

    const addScreeningPropsJob = new AddScreeningProps(scope, {
      id: 'addScreeningPropsJob',
      mlResultsBucketName: props.mlResultsBucket.bucketName,
      mlInputBucketName: props.metadataS3Bucket.bucketName,
      screeningStatus: 'SCREENING1_WIP',
    });

    const addScreeningPropsFullTextJob = new AddScreeningProps(scope, {
      id: 'addScreeningPropsFullTextJob',
      mlResultsBucketName: props.mlResultsBucket.bucketName,
      mlInputBucketName: props.processedPdfS3Bucket.bucketName,
      screeningStatus: 'SCREENING2_WIP',
    });

    const questionStepDefinition = new ComprehendQuestionSteps(scope);
    const questionStepMap = new Map(
      scope,
      'Map P, I, C, and O to their entities',
      {
        itemsPath: '$.questions',
        resultPath: '$.comprehendMedicalProximities',
        parameters: {
          'question.$': '$$.Map.Item.Value',
        },
      }
    );
    questionStepMap.iterator(questionStepDefinition);

    const comprehendRole = new Role(scope, 'ComprehendAccessRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('ComprehendMedicalFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });
    const detectEntitiesAbstractsAllJob = new LambdaInvoke(
      scope,
      'Process screening content in Comprehend',
      {
        lambdaFunction: new ComprehendAbstractSteps(scope, {
          namespace: props.namespace,
          role: comprehendRole,
          metadataS3Bucket: props.metadataS3Bucket,
          pdfS3Bucket: props.processedPdfS3Bucket,
          comprehendBucket: props.comprehendTermsBucket,
          dbPrefix: props.dbPrefix,
        }),
        outputPath: '$.Payload',
      }
    );

    const allComprehendProcessing = new Parallel(
      scope,
      'AllComprehendProcessing',
      {
        inputPath: '$',
        resultPath: '$.comprehendProcessingResults',
      }
    );
    allComprehendProcessing.branch(
      questionStepMap,
      detectEntitiesAbstractsAllJob
    );

    const combineResultsLambda = new Function(scope, 'CombineResultsLambda', {
      functionName: `${props.namespace}-combine`,
      description: 'Lambda that combines comprehend results',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-document-evaluation'),
      handler: 'index.combineHandler',
      memorySize: 512,
      timeout: Duration.minutes(15),
      environment: {
        ...commonLambdaEnvironment,
        COMPREHEND_BUCKET: props.comprehendTermsBucket.bucketName,
      },
    });
    props.comprehendTermsBucket.grantRead(combineResultsLambda);
    const combineResultsJob = new LambdaInvoke(scope, 'Combine Results Job', {
      lambdaFunction: combineResultsLambda,
      inputPath: '$',
      outputPath: '$.Payload',
    });

    const calculateProximitiesLambda = new Function(
      scope,
      'CalculateProximitiesLambda',
      {
        functionName: `${props.namespace}-proximities`,
        description: 'Lambda that calculates proximities',
        runtime: Runtime.NODEJS_14_X,
        code: codeFromPkg('@aws-ee/backend-document-evaluation'),
        handler: 'index.calculateProximitiesHandler',
        memorySize: 512,
        timeout: Duration.minutes(15),
        environment: {
          ...commonLambdaEnvironment,
          COMPREHEND_BUCKET: props.comprehendTermsBucket.bucketName,
          ML_RESULT_BUCKET: props.mlResultsBucket.bucketName,
        },
      }
    );
    props.comprehendTermsBucket.grantRead(calculateProximitiesLambda);
    const calculateProximitiesJob = new LambdaInvoke(
      scope,
      'Calculate Proximities Job',
      {
        lambdaFunction: calculateProximitiesLambda,
        outputPath: '$.Payload.proximities',
      }
    );
    const calculateProximitiesAllJob = new Map(
      scope,
      'Map Comprehend Medical Entities to Proximities',
      {
        itemsPath: '$.uniqueArticleIdList',
        resultPath: '$.comprehendMedicalProximities',
        parameters: {
          'screeningProps.$': '$.screeningProps',
          'comprehendProcessingResults.$': '$.comprehendProcessingResults',
          'item.$': '$$.Map.Item.Value',
        },
      }
    );
    calculateProximitiesAllJob.iterator(calculateProximitiesJob);

    const writeReportLambda = new Function(scope, 'WriteReportLambda', {
      functionName: `${props.namespace}-write-report`,
      description:
        'Lambda that collates the NLP processing output and creates a screening report.',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-reporting'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: Duration.minutes(15),
      environment: {
        ...commonLambdaEnvironment,
        COMPREHEND_BUCKET: props.comprehendTermsBucket.bucketName,
      },
    });
    props.screeningTable.grantReadWriteData(writeReportLambda);
    props.screeningTable.grant(writeReportLambda, 'dynamodb:DescribeTable');
    props.articleTable.grantReadWriteData(writeReportLambda);
    props.articleTable.grant(writeReportLambda, 'dynamodb:DescribeTable');
    props.mlResultsBucket.grantRead(writeReportLambda);
    const writeReportJob = new LambdaInvoke(scope, 'Write Report Job', {
      lambdaFunction: writeReportLambda,
    });

    const wait = new Wait(scope, 'Wait', {
      time: WaitTime.duration(Duration.seconds(100)),
    });

    const checkStatusLambda = new Function(scope, 'CheckStatusLambda', {
      functionName: `${props.namespace}-check-status`,
      description: 'Lambda that checks comprehend results status',
      runtime: Runtime.NODEJS_14_X,
      code: codeFromPkg('@aws-ee/backend-document-evaluation'),
      handler: 'index.checkStatusHandler',
      memorySize: 512,
      timeout: Duration.minutes(15),
      environment: {
        ...commonLambdaEnvironment,
        COMPREHEND_BUCKET: props.comprehendTermsBucket.bucketName,
      },
      role: comprehendRole,
    });
    const checkStatusChain = wait.next(
      new LambdaInvoke(scope, 'Check Status Job', {
        lambdaFunction: checkStatusLambda,
        inputPath: '$',
        outputPath: '$.Payload',
      })
    );
    const statusChoice = new Choice(scope, 'Comprehend Status?')
      .when(
        Condition.stringEquals('$.status', 'COMPLETED'), // If the Comprehend Job is complete, go to the combine results step. Otherwise, wait and recurse on the status check
        combineResultsJob.next(calculateProximitiesAllJob).next(writeReportJob)
      )
      .otherwise(checkStatusChain)
      .afterwards({
        includeErrorHandlers: false,
        includeOtherwise: false,
      });
    checkStatusChain.next(statusChoice);

    this.stateMachine = getScreeningStatus
      .next(
        new Choice(scope, 'Screening Status?')
          .when(
            Condition.stringEquals('$.Item.status.S', 'PROCESSED_CSV'),
            getMetadataJob.next(addScreeningPropsJob)
          )
          .when(
            Condition.stringEquals('$.Item.status.S', 'SCREENING1_COMPLETE'),
            getFullTextJob.next(addScreeningPropsFullTextJob)
          )
          .otherwise(
            new Fail(scope, 'Incorrect Status', {
              cause:
                'Screening status does not indicate that an ML workflow is ready to start',
            })
          )
          .afterwards({
            includeErrorHandlers: false,
            includeOtherwise: false,
          })
      )
      .next(allComprehendProcessing)
      .next(checkStatusChain);
  }
}
