import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { isDefined } from 'class-validator';
import type { S3Event } from 'aws-lambda';

import { LoggerService, parseS3Uri } from '@aws-ee/core';
import { ArticleDbService } from '@aws-ee/backend-common';

import { ScreeningInputModule } from './screening-input.module';
import { ScreeningInputService } from './services/screening-input.service';
import { csvStringToDocuments, Document } from './ingest-csv/ingest-csv';

async function bootstrap(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(ScreeningInputModule);
}

const contextPromise = bootstrap();

export const processMetadataHandler = async (event: S3Event) => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);
  const logger = context.get(LoggerService);

  for (const record of event.Records) {
    try {
      const s3Info = record.s3;
      const bucketName = JSON.stringify(s3Info.bucket.name).replace(/"/g, '');
      const objectKey = JSON.stringify(s3Info.object.key).replace(/"/g, '');
      const screeningIdentifier = objectKey.replace('metadata.csv', '').replace(/\//g, '');
      await inputService.pushInputUploadedStatus(screeningIdentifier);

      logger.info(`Processing object ${objectKey} from ${bucketName}`);

      const metadataCSVString = await inputService.downloadRawMetadataS3({ objectKey: s3Info.object.key });
      if ((metadataCSVString as any) instanceof Error) {
        logger.error(
          `Error downloading metadata for object ${objectKey}. Error: ${
            (metadataCSVString as any as Error).message
          }, stack: ${(metadataCSVString as any as Error).stack}`
        );
        continue;
      }

      const documents = await csvStringToDocuments(metadataCSVString);
      if (documents instanceof Error) {
        logger.error(`Error processing csv string to documents for object ${objectKey}: ${documents}`);
        continue;
      }

      logger.info(`Parsed CSV: ${JSON.stringify(documents)}`);
      await Promise.all(
        documents.map(async (document: Document) => {
          await inputService.processInputDocument({ screeningIdentifier, document });
        })
      );
      await inputService.pushInputProcessedStatus(screeningIdentifier);
    } catch (e) {
      logger.error(`Error processing document: ${e.message}`);
      // TODO: poison pill
    }
  }
};

export const getProcessedMetadataHandler = async (event: any) => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);
  const logger = context.get(LoggerService);

  const metadataS3Url: string = JSON.stringify(event.s3Url).replace(/"/g, '');

  logger.info(`Attempting to get metadata: ${metadataS3Url}`);
  try {
    const fileContent = await inputService.downloadProcessedMetadataS3({ prefix: metadataS3Url });

    return {
      content: fileContent,
    };
  } catch (e) {
    throw new Error(`Error getting metadata: ${e.message}`);
  }
};

export const processPdfs = async (screeningId: string): Promise<void> => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);
  const articleDbService = context.get(ArticleDbService);

  const articles = await articleDbService.getByScreeningId(screeningId);
  const filteredArticles = articles.filter(
    article => isDefined(article.firstDecisionSummary) && article.firstDecisionSummary! === 'approved'
  );
  try {
    await Promise.all(
      filteredArticles.map(async article => {
        const { Bucket, Key } = parseS3Uri({ s3Uri: article.source });
        // should be named by article ID as later in reporting step `comprehendMedicalProximities`
        // use `documentId` to write results to DDB which is the name of a file
        const objectTextKey = `${article.screeningId}/${article.id}`;
        await inputService.processPdf({ bucketName: Bucket, objectPdfKey: Key, objectTextKey });
      })
    );
  } catch (error) {
    console.error(`Error processing PDFs ${error.message}`);
    throw new Error(`Error processing PDFs: ${error.message}`);
  }
};

export const phase1Handler = async (event: any) => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);

  try {
    const screeningId: string = JSON.stringify(event.id.S).replace(/"/g, '');
    await inputService.pushPhase1WIPStatus(screeningId);

    return {
      screeningQuestions: event,
    };
  } catch (e) {
    throw new Error(`Error getting metadata: ${e.message}`);
  }
};

export const phase2Handler = async (event: any) => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);

  try {
    const screeningId: string = JSON.stringify(event.id.S).replace(/"/g, '');

    await processPdfs(screeningId);

    await inputService.pushPhase2WIPStatus(screeningId);

    return {
      screeningQuestions: event,
    };
  } catch (e) {
    throw new Error(`Error getting full text: ${e.message}`);
  }
};
