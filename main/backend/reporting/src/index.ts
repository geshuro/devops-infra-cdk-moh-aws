import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';

import { LoggerService } from '@aws-ee/core';
import { ArticleDbService, StatusPusherService } from '@aws-ee/backend-common';

import { ReportingModule } from './reporting.module';

async function bootstrap(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(ReportingModule);
}

const contextPromise = bootstrap();

export const handler = async (event: any) => {
  const context = await contextPromise;
  const logger = context.get(LoggerService);
  const articleDbService = context.get(ArticleDbService);
  const statusPusherService = context.get(StatusPusherService);

  const screeningProps = event.screeningProps;

  const screeningId = screeningProps.screeningId;

  const comprehendMedicalProximities: any[] = event.comprehendMedicalProximities;

  try {
    for (const comprehendMedicalProximity of comprehendMedicalProximities) {
      let update;
      if (screeningProps.screeningStatus === 'SCREENING1_WIP') {
        // first screening
        update = {
          picoPScore: comprehendMedicalProximity.p,
          picoIScore: comprehendMedicalProximity.i,
          picoCScore: comprehendMedicalProximity.c,
          picoOScore: comprehendMedicalProximity.o,
        };
      } else {
        // second screening
        update = {
          secondPicoPScore: comprehendMedicalProximity.p,
          secondPicoIScore: comprehendMedicalProximity.i,
          secondPicoCScore: comprehendMedicalProximity.c,
          secondPicoOScore: comprehendMedicalProximity.o,
        };
      }
      const originalDocumentId = comprehendMedicalProximity.documentId;
      const itemId = { id: originalDocumentId };
      const dbEntry = await articleDbService.get(itemId);
      if (dbEntry === null || dbEntry === undefined) {
        throw new Error(`Attempting to update an object that does not exist: ${JSON.stringify(itemId)}`);
      }
      await articleDbService.update(itemId, update);
    }

    if (screeningProps.screeningStatus === 'SCREENING1_WIP') {
      await statusPusherService.screening1AwaitingDecision({ screeningId });
    } else {
      await statusPusherService.screening2AwaitingDecision({ screeningId });
    }
  } catch (err) {
    logger.error(`Error attempting to write report results: ${err}`);
    return new Error(`Error attempting to write report results: ${err}`);
  }
};
