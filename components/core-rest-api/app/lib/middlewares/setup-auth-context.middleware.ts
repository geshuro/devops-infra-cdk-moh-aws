import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { ContextService, RequestContext, UserAuthzService } from '@aws-ee/core';
import { RequestAuthenticator, APIGatewayRequest } from '../extensions/request-authenticator';

@Injectable()
export class SetupAuthContextMiddleware implements NestMiddleware {
  constructor(
    private readonly authorizationService: UserAuthzService,
    private readonly contextService: ContextService,
    @Inject(RequestAuthenticator) private readonly requestAuthenticator: RequestAuthenticator,
  ) {}

  async use(req: APIGatewayRequest, res: Response, next: NextFunction): Promise<void> {
    res.locals.authenticated = false; // start with false;
    res.locals.requestContext = RequestContext.anonymous();

    const authorizer = await this.requestAuthenticator.getAuthenticationInfo(req, res);

    if (authorizer) {
      const { principal, token } = authorizer;
      res.locals.token = token;
      res.locals.principal = principal;
      res.locals.authenticated = true;
      if (principal) {
        const ability = await this.authorizationService.getAbilitiesOf(principal);
        res.locals.requestContext = RequestContext.authenticated({ principal, ability, i18n: req.i18n });
      }
    }
    this.contextService.set(res.locals.requestContext);
    next();
  }
}
