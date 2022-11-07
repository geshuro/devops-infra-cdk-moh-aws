import _ from 'lodash';
import { maliciousData, runSetup, errorCode } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;

describe('GET /api/oauth2/refresh', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe(`Positive`, () => {
    /**
     * TODO: implement the tests. The task requires a chain of things (going backwards):
     * 1. valid `refreshToken`
     * 2. to get #1 we need to use `/api/oauth2/token` endpoint
     * 3. to get a non 4xx response from #2 we need valid Cognito `code` and `pkceVerifier` name
     */
  });

  describe(`Negative`, () => {
    it(`should reject with random refreshToken`, async () => {
      await expect(
        adminSession.resources.oauth2.refresh.postCurrentCookieTokenAndReturnNewCookieToken(`randomRefreshToken`),
      ).rejects.toMatchObject({ code: httpCode.unauthorized });
    });

    it(`should reject with long refreshToken`, async () => {
      await expect(
        adminSession.resources.oauth2.refresh.postCurrentCookieTokenAndReturnNewCookieToken(maliciousData.longString),
      ).rejects.toMatchObject({ code: httpCode.badRequest });
    });

    it(`should reject with random params`, async () => {
      await expect(
        adminSession.resources.oauth2.refresh.postCurrentCookieTokenAndReturnNewCookieToken(),
      ).rejects.toMatchObject({ code: httpCode.unauthorized });
    });

    it(`should reject with random params for anon`, async () => {
      const session = await setup.createAnonymousSession();
      await expect(
        session.resources.oauth2.refresh.postCurrentCookieTokenAndReturnNewCookieToken(),
      ).rejects.toMatchObject({ code: httpCode.unauthorized });
    });
  });
});
