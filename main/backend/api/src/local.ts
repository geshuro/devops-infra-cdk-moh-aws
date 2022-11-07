/**
 * This is the entry point for local debugging
 */
import 'regenerator-runtime';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { defaultValidationPipe, LoggerService } from '@aws-ee/core';
import { CoreExceptionsFilter } from '@aws-ee/core-rest-api';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiHandlerModule } from './api-handler.module';

const port = 4000;
const stage = process.env.APP_STAGE!;
const corsAllowList: string[] = ['http://localhost:3000']; // allow access to the local ui

async function bootstrap() {
  const app = await NestFactory.create(ApiHandlerModule);

  const logger = app.get(LoggerService);
  app
    .useGlobalFilters(new CoreExceptionsFilter(logger))
    .useGlobalPipes(defaultValidationPipe)
    .setGlobalPrefix(stage)
    .use(cookieParser())
    .enableCors({
      origin: corsAllowList,
      credentials: true,
    });

  SwaggerModule.setup(
    'api',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('MOH Spain').setDescription('Screening API').setVersion('1.0').build(),
    ),
  );

  await app.listen(port);

  console.info(`\nThe API is now listening on http://localhost:${port}/${stage}\n`);
}

bootstrap();
