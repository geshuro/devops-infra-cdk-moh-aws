import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { GetObjectCommandOutput, S3 } from '@aws-sdk/client-s3';

import { LoggerService, streamToString } from '@aws-ee/core';

import { config } from '../screening-request.config';

interface ScreeningRequest {
  clinicalQuestion: string;
  picoP: string;
  picoI: string;
  picoC: string; 
  picoO: string;
}

@Injectable()
export class ImportService {
  private readonly s3Client;
  private log: LoggerService;

  constructor(
    log: LoggerService,
  ) {
    this.s3Client = new S3({});
    this.log = log;
  }

  async getDummyData(props: { targetName: string }): Promise<GetObjectCommandOutput> {
    return await this.s3Client.getObject({
      Bucket: config.screeningBucketName,
      Key: `${config.clinicalQuestionIdentifier}/${props.targetName}`,
    });
  }

  async uploadDummyDataToRawMetadataS3() {
    try {
      const targetName = 'metadata.csv'
      const { Body } = await this.getDummyData({ targetName });

      await this.s3Client.putObject({
        Bucket: config.mlInputBucketName,
        Key: `${config.clinicalQuestionIdentifier}/${targetName}`,
        Body: await streamToString({ stream: Body as Readable }),
      });

      this.log.info(`Uploading metadata CSV for ${config.clinicalQuestionIdentifier} to ${config.mlInputBucketName}/dummy/${config.clinicalQuestionIdentifier}/${targetName}`);
    } catch (err) {
      this.log.error(`Error attempting to write to metadata bucket: ${err}`);
    }
  }

  async uploadDummyDataPdfToS3() {
    try {
      await this.s3Client.copyObject({
        Bucket: config.pdfBucketName,
        CopySource: `${config.screeningBucketName}/random-journal.pdf`,
        Key: `${config.clinicalQuestionIdentifier}/random-journal.pdf`
      });

      this.log.info(`Uploading PDF to ${config.pdfBucketName}/${config.clinicalQuestionIdentifier}/random-journal.pdf`);
    } catch (err) {
      this.log.error(`Error attempting to write to PDF bucket: ${err}`);
    }
  }

  async writeScreeningToDDB(props: { metadataSource: string }) {
    try {
      const { Body } = await this.getDummyData({ targetName: 'request.json' });
      const request = await streamToString({ stream: Body as Readable });

      const screeningRequest: ScreeningRequest = JSON.parse(request);
      const params = {
        Item: {
          'id': {
            S: `dummy${config.clinicalQuestionIdentifier}`
          }, 
          'createdBy': {
            S: 'dummy'
          },
          'status': {
            S: 'UPLOADEDCSV'
          },
          'clinicalQuestion': {
            S: screeningRequest.clinicalQuestion
          },
          'picoP': {
            S: screeningRequest.picoP
          },
          'picoI': {
            S: screeningRequest.picoI
          },
          'picoC': {
            S: screeningRequest.picoC
          },
          'picoO': {
            S: screeningRequest.picoO
          },
          'csvMetadataSource': {
            S: props.metadataSource
          }
        }, 
        TableName: config.dbPrefix
      };
    } catch (err) {
      this.log.error(`Error attempting to write to screening DDB table: ${err}`)
    }
  }

  async run(): Promise<void> {
    this.log.info(`Uploading request for ${config.clinicalQuestionIdentifier}`);
    try {
      await this.uploadDummyDataToRawMetadataS3();
      await this.uploadDummyDataPdfToS3();
      await this.writeScreeningToDDB({metadataSource: ''});
    } catch (err) {
      this.log.error(`Error attempting to start request: ${err}`);
    }
  }
}
