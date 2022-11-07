import pdf from 'pdf-extraction';
import truncate from 'truncate-utf8-bytes';

import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService, streamToString, parseS3Uri, streamToBuffer } from '@aws-ee/core';
import { ArticleDbService, StatusPusherService } from '@aws-ee/backend-common';

import { S3, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

import { isUndefined } from 'lodash';

import { ScreeningInputConfig } from '../config/screening-input.config';
import { Document as CSVDocument } from '../ingest-csv/ingest-csv';

@Injectable()
export class ScreeningInputService {
  private s3Client: S3;
  private articleDbService: ArticleDbService;
  private statusPusherService: StatusPusherService;
  private config: ScreeningInputConfig;
  private log: LoggerService;

  constructor(
    log: LoggerService,
    articleDbService: ArticleDbService,
    statusPusherService: StatusPusherService,
    configService: ConfigService
  ) {
    this.s3Client = new S3({});
    this.articleDbService = articleDbService;
    this.statusPusherService = statusPusherService;
    this.log = log;
    this.config = configService.get<ScreeningInputConfig>(ScreeningInputConfig.KEY)!;
  }

  async processInputDocument(props: { screeningIdentifier: string; document: CSVDocument }) {
    await this.uploadProcessedMetadataS3(props);
    await this.writeDocumentToDDB(props);
  }

  async writeDocumentToDDB(props: { screeningIdentifier: string; document: CSVDocument }) {
    await this.articleDbService.create({
      id: props.document.id,
      title: props.document.title,
      author: props.document.author,
      abstract: props.document.abstract,
      source: `s3://${this.config.rawPdfBucket}/${props.screeningIdentifier}/${props.document.source}`,
      screeningId: props.screeningIdentifier,
    });
  }

  async s3GetBody(props: { bucket: string; objectKey: string }): Promise<Readable> {
    try {
      const { Body } = await this.s3Client.getObject({
        Bucket: props.bucket,
        Key: props.objectKey,
      });
      if (!Body) {
        throw new Error(`Requested file ${props.objectKey} is empty.`);
      }
      return Body as Readable;
    } catch (err) {
      throw new Error(`Error attempting to read from bucket: ${err}`);
    }
  }

  private async s3Get(props: { bucket: string; objectKey: string }): Promise<string> {
    const Body = await this.s3GetBody(props);
    return streamToString({ stream: Body });
  }

  async downloadRawMetadataS3(props: { objectKey: string }): Promise<string> {
    if (!props.objectKey.endsWith('metadata.csv')) {
      throw new Error(`Requested file ${props.objectKey} is not metadata CSV, aborting metadata download process`);
    }
    return this.s3Get({
      bucket: this.config.rawMetadataBucket!,
      objectKey: props.objectKey,
    });
  }

  async downloadProcessedMetadataS3(props: { prefix: string }): Promise<string> {
    return this.s3Get({
      bucket: this.config.processedMetadataBucket!,
      objectKey: props.prefix,
    });
  }

  async getProcessedMetadataS3Urls(props: { prefix: string }): Promise<string[]> {
    this.log.info(`Getting processed metadata URLs at ${props.prefix}`);
    const { Key } = parseS3Uri({ s3Uri: props.prefix });
    try {
      const objectsInPrefix: ListObjectsV2CommandOutput = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.processedMetadataBucket,
          Prefix: Key,
        })
      );
      if (isUndefined(objectsInPrefix)) {
        return [];
      }

      if (objectsInPrefix.IsTruncated) {
        this.log.info(`Results list is truncated`); // TODO - handle this case
      }

      return objectsInPrefix.Contents!.map(item => item.Key!);
    } catch (err) {
      throw new Error(`Error attempting to get processed metadata URLs: ${err}`);
    }
  }

  async uploadProcessedMetadataS3(props: { screeningIdentifier: string; document: CSVDocument }) {
    try {
      await this.s3Client.putObject({
        Bucket: this.config.processedMetadataBucket,
        Key: `${props.screeningIdentifier}/${props.document.id}`,
        Body: JSON.stringify(props.document),
      });
    } catch (err) {
      this.log.error(`Error attempting to write to processed metadata bucket: ${err}`);
    }
  }

  async processPdf(props: { bucketName: string, objectPdfKey: string, objectTextKey: string }) {
    const Body = await this.s3GetBody({
      bucket: props.bucketName,
      objectKey: props.objectPdfKey,
    });

    await this.writePdfStreamAsText(Body, props.objectTextKey);
  }

  async pushInputUploadedStatus(screeningIdentifier: string) {
    await this.statusPusherService.uploadedCSV({
      screeningId: screeningIdentifier,
    });
  }

  async pushInputProcessedStatus(screeningIdentifier: string) {
    await this.statusPusherService.processedCSV({
      screeningId: screeningIdentifier,
    });
  }

  async pushPhase1WIPStatus(screeningIdentifier: string) {
    await this.statusPusherService.screening1WIP({
      screeningId: screeningIdentifier,
    });
  }

  async pushPhase2WIPStatus(screeningIdentifier: string) {
    await this.statusPusherService.screening2WIP({
      screeningId: screeningIdentifier,
    });
  }

  async writePdfStreamAsText(stream: Readable, Key: string): Promise<void> {
    const buffer = await streamToBuffer({ stream });
    const pdfTextResult = await pdf(buffer);

    // Note - we only process the first 10,000 bytes of the input file,
    // as that is the limit of what Comprehend Medical can currently process:
    // https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-quotas.html
    await this.s3Client.putObject({
      Bucket: this.config.processedPdfBucket,
      Key,
      Body: truncate(pdfTextResult.text, 40000),
    });
  }
}
