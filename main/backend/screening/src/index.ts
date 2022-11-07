import { isDefined } from 'class-validator';

import type { DynamoDBStreamHandler } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '@aws-ee/core';

import { ScreeningHandlerModule } from './screening-handler.module';
import { ScreeningConfig } from './config/screening.config';

const contextPromise = NestFactory.createApplicationContext(ScreeningHandlerModule);
const stepfunctions = new SFNClient({});

export const screeningStreamHandler: DynamoDBStreamHandler = async (event) => {
  const context = await contextPromise;
  const config = context.get(ConfigService).get<ScreeningConfig>(ScreeningConfig.KEY)!;
  const logger = context.get(LoggerService);

  const stateMachineArn = config.stateMachineArn;

  const startMLStatus = (status: string | undefined): boolean => isDefined(status) && (status === 'PROCESSED_CSV' || status === 'SCREENING1_COMPLETE');

  for (const record of event.Records) {
    logger.info(`Starting ML workflow with source ${JSON.stringify(record.dynamodb)}`);

    if (isDefined(record.dynamodb) && isDefined(record.dynamodb!.NewImage) && isDefined(record.dynamodb!.NewImage!.id) && isDefined(record.dynamodb!.NewImage!.status)) {
      const params = new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify({
          screeningId: record.dynamodb!.NewImage!.id.S!,
          status: record.dynamodb!.NewImage!.status.S!
        }),
        name: `${record.dynamodb!.NewImage!.id.S!}-${Date.now()}`,
      });

      if (startMLStatus(record.dynamodb!.NewImage!.status.S)) {
        try {
          await stepfunctions.send(params);
        } catch (err) {
          logger.error(err);
        } finally {
          logger.info(`Sent execution start command with params ${JSON.stringify(params)}`);
        }
      }
    }
  }
}
