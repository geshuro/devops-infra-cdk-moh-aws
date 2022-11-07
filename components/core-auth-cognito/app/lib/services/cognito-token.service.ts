import { ConfigService } from '@nestjs/config';
import { HttpService, Injectable, UnauthorizedException, InternalServerErrorException, Optional } from '@nestjs/common';
import {
  TokenManager,
  AuthorizeProps,
  AuthorizeResponse,
  ExchangeAuthCodeProps,
  ExchangeAuthCodeResponse,
  RevokeTokenResponse,
  RevokeTokenProps,
} from '@aws-ee/core-rest-api';
import { Boom, LoggerService } from '@aws-ee/core';
import { CognitoApiConfig } from '../config/cognito-api-config';
import { CognitoRevokedAccessService } from './cognito-revoked-access.service';

@Injectable()
export class CognitoTokenService implements TokenManager {
  private config: CognitoApiConfig;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
    private readonly log: LoggerService,
    @Optional() private readonly revokedAccessService?: CognitoRevokedAccessService,
  ) {
    this.config = configService.get<CognitoApiConfig>(CognitoApiConfig.KEY)!;
  }

  /**
   * Starts the Cognito Auth Code flow.
   */
  async authorize(props: AuthorizeProps): Promise<AuthorizeResponse> {
    const redirectUrl = new URL(this.config.authorizeUrl);
    redirectUrl.searchParams.set('response_type', 'code');
    redirectUrl.searchParams.set('client_id', this.config.userPoolClientId);
    redirectUrl.searchParams.set('redirect_uri', props.redirectUrl ?? this.config.websiteUrl);
    if (props.state) {
      redirectUrl.searchParams.set('state', props.state);
    }
    if (props.pkceChallenge) {
      redirectUrl.searchParams.set('code_challenge_method', 'S256');
      redirectUrl.searchParams.set('code_challenge', props.pkceChallenge);
    }

    return {
      redirectUrl: redirectUrl.toString(),
    };
  }

  /**
   * Part of the Auth Code flow. This function exchanges a one-time opaque
   * code against an access token and a refresh token.
   *
   * The one time code has been retrieved from Cognito by the API consumer (UI for example)
   */
  async exchangeAuthCodeForTokens(props: ExchangeAuthCodeProps): Promise<ExchangeAuthCodeResponse> {
    const params = new URLSearchParams();
    params.append('code', props.authCode);
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.config.userPoolClientId);
    params.append('redirect_uri', props.redirectUrl ?? this.config.websiteUrl);

    if (props.pkceVerifier) {
      params.append('code_verifier', props.pkceVerifier);
    }

    try {
      const response = await this.httpService
        .post(this.config.tokenUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .toPromise();

      return {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (err) {
      this.log.error(err);
      throw new UnauthorizedException(Boom.safeMsg('An error occurred when fetching the token.'));
    }
  }

  /**
   * Fetch a new token using the refresh token.
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', this.config.userPoolClientId);
    params.append('refresh_token', refreshToken);
    params.append('redirect_uri', this.config.websiteUrl);

    try {
      const response = await this.httpService
        .post(this.config.tokenUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .toPromise();

      return response.data.access_token;
    } catch (err) {
      this.log.error(err);
      throw new UnauthorizedException(Boom.safeMsg('An error occurred when refreshing the token.'));
    }
  }

  /**
   * Revokes a token and renders a Cognito logout URI
   */
  async revokeToken(props: RevokeTokenProps): Promise<RevokeTokenResponse> {
    const logoutUrl = new URL(this.config.logoutUrl);
    logoutUrl.searchParams.set('client_id', this.config.userPoolClientId);
    logoutUrl.searchParams.set('logout_uri', props.redirectUrl ?? this.config.websiteUrl);

    await this.revokedAccessService?.revokeAccess({ token: props.token });
    await this.revokeRefreshToken(props.refreshToken);

    return {
      logoutUrl: logoutUrl.toString(),
    };
  }

  /**
   * Invalidates the refresh token with Cognito
   */
  private async revokeRefreshToken(refreshToken: string) {
    const params = new URLSearchParams();
    params.append('token', refreshToken);
    params.append('client_id', this.config.userPoolClientId);

    try {
      await this.httpService
        .post(this.config.revocationUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .toPromise();
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(Boom.safeMsg('An error occurred when revoking the refresh token.'));
    }
  }
}
