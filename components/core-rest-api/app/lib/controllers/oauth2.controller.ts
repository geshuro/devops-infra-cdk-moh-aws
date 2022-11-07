/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Boom } from '@aws-ee/core';
import { Body, Controller, Inject, Post, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

import { ApiHandlerConfig } from '../config/api-handler-config';
import { TokenManager } from '../extensions/token-manager';
import { AuthCodeDto } from '../models/oauth2/auth-code.model';
import { AuthorizeDto } from '../models/oauth2/authorize.model';
import { LogoutDto } from '../models/oauth2/logout.model';
import { CookieTokenReader, CookieTokenWriter } from '../utils/auth-cookie-helper';

@Controller('/api/oauth2')
export class Oauth2Controller {
  private tokenReader = new CookieTokenReader();
  private tokenWriter: CookieTokenWriter;

  constructor(@Inject(TokenManager) private readonly tokenManager: TokenManager, configService: ConfigService) {
    const config = configService.get<ApiHandlerConfig>(ApiHandlerConfig.KEY)!;
    this.tokenWriter = new CookieTokenWriter(config.stage);
  }

  @Post('authorize')
  async authorize(@Body() body: AuthorizeDto) {
    return this.tokenManager.authorize({
      redirectUrl: body.redirectUrl,
      state: body.state,
      pkceChallenge: body.pkceChallenge,
    });
  }

  @Post('token')
  async vendTokens(@Res({ passthrough: true }) response: Response, @Body() body: AuthCodeDto) {
    const tokens = await this.tokenManager.exchangeAuthCodeForTokens({
      authCode: body.code,
      redirectUrl: body.redirectUrl,
      pkceVerifier: body.pkceVerifier,
    });

    this.tokenWriter.writeToken(response, tokens.token);
    this.tokenWriter.writeRefreshToken(response, tokens.refreshToken);
    return { isAuthenticated: true };
  }

  @Post('refresh')
  async refreshTokens(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.tokenReader.readRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException(Boom.safeMsg('No token provided.'));
    }

    const token = await this.tokenManager.refreshToken(refreshToken);
    this.tokenWriter.writeToken(response, token);

    return { isAuthenticated: true };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response, @Body() body: LogoutDto) {
    const token = this.tokenReader.readToken(request);
    const refreshToken = this.tokenReader.readRefreshToken(request);

    if (token && refreshToken) {
      this.tokenWriter.clearToken(response);
      this.tokenWriter.clearRefreshToken(response);

      return this.tokenManager.revokeToken({ token, refreshToken, redirectUrl: body.redirectUrl });
    }

    return {};
  }
}
