import { Readable } from 'stream';
import { isUndefined } from 'lodash';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerService, streamToString, parseS3Uri } from '@aws-ee/core';

import {
  ComprehendMedicalClient,
  StartEntitiesDetectionV2JobCommand,
  StartICD10CMInferenceJobCommand,
  StartRxNormInferenceJobCommand,
  LanguageCode,
  DescribeEntitiesDetectionV2JobCommand,
  DescribeICD10CMInferenceJobCommand,
  DescribeRxNormInferenceJobCommand,
  Entity
} from '@aws-sdk/client-comprehendmedical';
import {
  S3,
  ListObjectsV2CommandOutput,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

import { DocumentEvaluationConfig } from '../config/document-evaluation.config';

interface ComprehendJobProps {
  prefix: string,
  screeningId: string,
  jobType: string,
  jobId: string
}

@Injectable()
export class ComprehendService {
  private comprehendClient: ComprehendMedicalClient;
  private s3Client: S3;
  private config: DocumentEvaluationConfig;
  private log: LoggerService;

  constructor(
    log: LoggerService,
    configService: ConfigService) {

    this.comprehendClient = new ComprehendMedicalClient({});
    this.s3Client = new S3({});
    this.log = log;
    this.config = configService.get<DocumentEvaluationConfig>(DocumentEvaluationConfig.KEY)!;
  }

  async batchComprehend(props: {screeningId: string, inputBucketPath: string}) {
    const comprehendBucketName = this.config.comprehendBucketName;
    const { Bucket, Key } = parseS3Uri({ s3Uri: props.inputBucketPath });

    const entitiesCommand = new StartEntitiesDetectionV2JobCommand({
      InputDataConfig: {
        S3Bucket: Bucket,
        S3Key: Key
      },
      OutputDataConfig: {
        S3Bucket: comprehendBucketName,
        S3Key: `${Key}Entities`
      },
      DataAccessRoleArn: this.config.comprehendRole,
      JobName: `${props.screeningId}-${Date.now()}`,
      LanguageCode: LanguageCode.EN
    });
    this.log.info(`Starting comprehend processing: ${JSON.stringify(entitiesCommand)}`);
    const response = await this.comprehendClient.send(entitiesCommand);

    const icd10CMCommand = new StartICD10CMInferenceJobCommand({
      InputDataConfig: {
        S3Bucket: Bucket,
        S3Key: Key
      },
      OutputDataConfig: {
        S3Bucket: comprehendBucketName,
        S3Key: `${Key}ICD10CM`
      },
      DataAccessRoleArn: this.config.comprehendRole,
      JobName: `${props.screeningId}-${Date.now()}`,
      LanguageCode: LanguageCode.EN
    });
    this.log.info(`Starting comprehend processing: ${JSON.stringify(icd10CMCommand)}`);
    const icd10CMResponse = await this.comprehendClient.send(icd10CMCommand);

    const rxNormCommand = new StartRxNormInferenceJobCommand({
      InputDataConfig: {
        S3Bucket: Bucket,
        S3Key: Key
      },
      OutputDataConfig: {
        S3Bucket: comprehendBucketName,
        S3Key: `${Key}RxNorm`
      },
      DataAccessRoleArn: this.config.comprehendRole,
      JobName: `${props.screeningId}-${Date.now()}`,
      LanguageCode: LanguageCode.EN
    });
    this.log.info(`Starting comprehend processing: ${JSON.stringify(rxNormCommand)}`);
    const rxNormResponse = await this.comprehendClient.send(rxNormCommand);

    return {
      comprehendResponse: response,
      comprehendBucketPath: `${comprehendBucketName}`,
      screeningId: Key.replace('/', ''),
      jobId: {
        entities: response.JobId!, 
        icd10CM: icd10CMResponse.JobId!,
        rxNorm: rxNormResponse.JobId!
      }
    }
  }

  async getStatus(jobIds: {entities: string, icd10CM: string, rxNorm: string}): Promise<string[]> {
    const describeCommand = new DescribeEntitiesDetectionV2JobCommand({
      JobId: jobIds.entities
    });

    const describeICD10CMCommand = new DescribeICD10CMInferenceJobCommand({
      JobId: jobIds.icd10CM
    });

    const describeRxNormCommand = new DescribeRxNormInferenceJobCommand({
      JobId: jobIds.rxNorm
    });

    const results = await Promise.all([describeCommand, describeICD10CMCommand, describeRxNormCommand].map(command => this.comprehendClient.send(command)));
    return results.map(result => result.ComprehendMedicalAsyncJobProperties!.JobStatus!);
  }

  private getPath(props: ComprehendJobProps) {
    return `${props.screeningId}/${props.prefix}/${this.config.accountId!}-${props.jobType}-${props.jobId}`;
  }

  async getManifest(props: ComprehendJobProps) {
    const comprehendBucketName = this.config.comprehendBucketName;
    const path = this.getPath(props);

    this.log.info(`Attempting to get manifest at: ${comprehendBucketName}/${path}/Manifest`);

    const { Body } = await this.s3Client.getObject({
      Bucket: comprehendBucketName,
      Key: `${path}/Manifest`,
    });
    if (!Body) {
      throw new Error(`Requested file ${path}/Manifest is empty.`)
    }
    const content = await streamToString({ stream: Body as Readable });
    const contentJson = JSON.parse(content);
    if (contentJson.Summary.Status !== 'COMPLETED') {
      this.log.error(`The comprehend manifest indicates a broken or incomplete run of the ML workflow: ${content}`);
      // TODO - throw error
    }
    const { Bucket, Path } = contentJson.Summary.OutputDataConfiguration;

    return {
      Bucket,
      Path
    }
  }

  async getOutputFiles(props: { bucket: string, path: string }): Promise<string[]> {
    try {
      const objectsInPrefix: ListObjectsV2CommandOutput = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: props.bucket,
        Prefix: props.path,
      }));
      if (isUndefined(objectsInPrefix)) {
        return [];
      }
  
      if (objectsInPrefix.IsTruncated) {
        this.log.info(`Results list is truncated`); // TODO - handle this case
      }
  
      return objectsInPrefix.Contents!.map(item => item.Key!).filter(item => item.endsWith('.out'));
    } catch (err) {
      throw new Error(`Error attempting to list comprehend output: ${err}`);
    }
  }

  private async getEntitiesS3Object(props: { bucket: string, path: string }): Promise<Entity[]> {
    const { Body } = await this.s3Client.getObject({
      Bucket: props.bucket,
      Key: props.path,
    });

    const content = JSON.parse(await streamToString({ stream: Body as Readable }));

    this.log.info(`getEntitiesS3Object result: ${JSON.stringify(content)}`)
    return content.Entities;
  }
 
  async getEntities(props: ComprehendJobProps, articleId: string): Promise<Entity[]> {
    const bucket = this.config.comprehendBucketName;
    return this.getEntitiesS3Object({
      bucket,
      path: `${this.getPath(props)}/${articleId}.out`
    });
  }
}
