import _ from 'lodash';
import { runSetup, maliciousData } from '@aws-ee/api-testing-framework';

describe('GET /api/oauth2/token', () => {
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
    // TODO: implement
  });

  describe(`Negative`, () => {
    const error = new Error(`An error occurred when fetching the token.`);

    it(`should reject with random params for admin`, async () => {
      await expect(
        adminSession.resources.oauth2.token.post({
          code: setup.gen.string(),
          redirectUrl: setup.gen.string(),
          pkceVerifier: setup.gen.string(),
        }),
      ).rejects.toEqual(error);
    });

    it(`should reject with random params for anonymous session`, async () => {
      const session = await setup.createAnonymousSession();
      await expect(
        session.resources.oauth2.token.post({
          code: setup.gen.string(),
          redirectUrl: setup.gen.string(),
          pkceVerifier: setup.gen.string(),
        }),
      ).rejects.toEqual(error);
    });

    it(`should reject with long params`, async () => {
      await expect(
        adminSession.resources.oauth2.token.post({
          code: maliciousData.longString,
          redirectUrl: 'https://example.com/redirect',
          pkceVerifier: maliciousData.longString,
        }),
      ).rejects.toThrowError('Something went wrong calling the server (413)');
    });
  });
});
