/* eslint-disable max-classes-per-file */
import type { Request, Response } from 'express';

const TOKEN_COOKIE = 'token';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

export class CookieTokenReader {
  readToken(req: Request): string | undefined {
    return req.cookies[TOKEN_COOKIE];
  }

  readRefreshToken(req: Request): string | undefined {
    return req.cookies[REFRESH_TOKEN_COOKIE];
  }
}

export class CookieTokenWriter {
  constructor(private readonly stage: string) {}

  writeToken(res: Response, token: string): void {
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      path: `/${this.stage}/api`, // The cookie will be posted along with all api requests
    });
  }

  clearToken(res: Response): void {
    res.clearCookie(TOKEN_COOKIE, {
      httpOnly: true,
      secure: true,
      path: `/${this.stage}/api`,
    });
  }

  writeRefreshToken(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      path: `/${this.stage}/api/oauth2`, // The cookie will only be posted to the oauth2 controller
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: true,
      path: `/${this.stage}/api/oauth2`,
    });
  }
}
