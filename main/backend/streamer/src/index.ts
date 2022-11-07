import 'regenerator-runtime';
import type { DynamoDBStreamHandler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { DdbStreamersModule } from './ddb-streamers.module';
import { ArticlesStreamerService } from './services/articles-streamer.service';
import { ScreeningsStreamerService } from './services/screenings-streamer.service';

const contextPromise = NestFactory.createApplicationContext(DdbStreamersModule);

export const articlesStreamHandler: DynamoDBStreamHandler = async (event) => {
  const context = await contextPromise;
  const streamerService = context.get(ArticlesStreamerService);
  await streamerService.streamRecords(event.Records);
};

export const screeningsStreamHandler: DynamoDBStreamHandler = async (event) => {
  const context = await contextPromise;
  const streamerService = context.get(ScreeningsStreamerService);
  await streamerService.streamRecords(event.Records);
};
