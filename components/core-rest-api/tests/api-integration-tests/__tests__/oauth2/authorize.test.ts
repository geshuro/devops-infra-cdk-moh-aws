import _ from 'lodash';
import { runSetup, maliciousData, errorCode } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;

describe('GET /api/oauth2/authorize', () => {
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
    it(`should offer redirect even with random params`, async () => {
      await expect(adminSession.resources.oauth2.authorize.post()).resolves.toMatchObject({
        redirectUrl: expect.stringMatching(/^http.*/),
      });
    });

    it(`should offer redirect even with random params even for anon`, async () => {
      const session = await setup.createAnonymousSession();
      await expect(session.resources.oauth2.authorize.post()).resolves.toMatchObject({
        redirectUrl: expect.stringMatching(/^http.*/),
      });
    });
  });

  describe(`Negative`, () => {
    it(`should reject with long params`, async () => {
      await expect(
        adminSession.resources.oauth2.authorize.post({
          redirectUrl: maliciousData.longString,
          state: maliciousData.longString,
          pkceChallenge: maliciousData.longString,
        }),
      ).rejects.toMatchObject({ code: httpCode.payloadTooLarge });
    });
  });
});
