import type { Principal } from '@aws-ee/core';
import type { APIGatewayEvent } from 'aws-lambda';
import type { Request, Response } from 'express';

export type APIGatewayRequest = Pick<Request, 'cookies'> & {
  apiGateway?: {
    event?: APIGatewayEvent;
  };
  i18n?: unknown;
};

export type AuthenticationInfo = {
  token: string;
  principal: Principal;
};

export const RequestAuthenticator = Symbol('requestAuthenticator');

export interface RequestAuthenticator {
  getAuthenticationInfo(req: unknown, res: Response): Promise<AuthenticationInfo | undefined>;
}
