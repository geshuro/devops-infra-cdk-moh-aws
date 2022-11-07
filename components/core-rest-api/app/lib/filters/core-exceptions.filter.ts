import type { Context } from 'aws-lambda';
import type { Request, Response } from 'express';
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Boom, LoggerService } from '@aws-ee/core';

/**
 * NestJS exceptions have a getStatus() method
 */
interface ExceptionWithStatusGetter {
  getStatus(): number;
}

interface EntityTooLargeException {
  type: 'entity.too.large';
}

interface ForbiddenError {
  name: 'ForbiddenError';
}

@Catch()
export class CoreExceptionsFilter implements ExceptionFilter {
  constructor(private readonly log: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = getHttpStatus(exception);
    let message: string | undefined;
    let payload: unknown;
    const requestId = getAwsRequestId(request);

    const exceptionResponse = (exception as { response?: unknown }).response;

    if (Boom.isBoom(exceptionResponse) && exceptionResponse.safe) {
      message = exceptionResponse.message;
      payload = exceptionResponse.payload;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      if (exception instanceof Error) {
        this.log.error(exception.message);
        this.log.error(exception.stack);
      } else {
        this.log.error(exception);
      }
    }

    response.set('X-Request-Id-2', requestId).status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      message,
      payload,
    });
  }
}

function getHttpStatus(exception: unknown): number {
  let status = HttpStatus.INTERNAL_SERVER_ERROR;

  if ((exception as ForbiddenError).name === 'ForbiddenError') {
    status = HttpStatus.FORBIDDEN;
  } else if (hasStatusGetter(exception)) {
    status = exception.getStatus();
  } else if ((exception as EntityTooLargeException).type === 'entity.too.large') {
    status = HttpStatus.PAYLOAD_TOO_LARGE;
  }

  return status;
}

function hasStatusGetter(exception: unknown): exception is ExceptionWithStatusGetter {
  return typeof (exception as ExceptionWithStatusGetter).getStatus === 'function';
}

function getAwsRequestId(request: unknown): string | undefined {
  return (
    request as {
      apiGateway?: {
        context?: Context;
      };
    }
  ).apiGateway?.context?.awsRequestId;
}
