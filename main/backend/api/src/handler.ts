import 'regenerator-runtime';
import type { Server } from 'http';
import type { APIGatewayProxyHandler } from 'aws-lambda';
import { loadEnvConfig } from '@aws-ee/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createServer, proxy } from 'aws-serverless-express';
import cookieParser from 'cookie-parser';
import { eventContext } from 'aws-serverless-express/middleware';
import { ApiHandlerConfig, CoreExceptionsFilter } from '@aws-ee/core-rest-api';
import express from 'express';
import { ContextService, defaultValidationPipe, LoggerService } from '@aws-ee/core';
import { NestFactory } from '@nestjs/core';

import { ApiHandlerModule } from './api-handler.module';
import { CommonResponseHeadersInterceptor } from './common-response-headers.interceptor';

let contextService: ContextService;

async function bootstrap(): Promise<Server> {
  const expressApp = express();

  const app = await NestFactory.create(ApiHandlerModule, new ExpressAdapter(expressApp));

  const logger = app.get(LoggerService);
  contextService = app.get(ContextService);
  app
    .useGlobalInterceptors(new CommonResponseHeadersInterceptor())
    .useGlobalFilters(new CoreExceptionsFilter(logger))
    .useGlobalPipes(defaultValidationPipe)
    .use(cookieParser())
    .use(
      eventContext({
        deleteHeaders: true,
      }),
    );

  const config = loadEnvConfig(ApiHandlerConfig);

  // Only enable CORS if there is at least one allowed client
  const corsAllowList: string[] = JSON.parse(config.corsAllowList);
  if (corsAllowList.length) {
    app.enableCors({
      origin: corsAllowList,
      credentials: true,
    });
  }

  await app.init();

  return createServer(expressApp);
}

const serverPromise = bootstrap();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const server = await serverPromise;
  contextService.clear();
  return proxy(server, event, context, 'PROMISE').promise;
};
