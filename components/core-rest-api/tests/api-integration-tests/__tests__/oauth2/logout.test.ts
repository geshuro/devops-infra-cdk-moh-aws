import _ from 'lodash';
import { runSetup, maliciousData } from '@aws-ee/api-testing-framework';

describe('GET /api/oauth2/logout', () => {
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
    it(`should offer a logout link for any auth cookies`, async () => {
      await expect(
        adminSession.resources.oauth2.logout.postAuthCookies({
          token: setup.gen.string(),
          refreshToken: setup.gen.string(),
        }),
      ).resolves.toMatchObject({ logoutUrl: expect.stringMatching(/^http/) });
    });
  });

  describe(`Negative`, () => {
    it(`should return empty object with empty auth cookies`, async () => {
      await expect(adminSession.resources.oauth2.logout.postAuthCookies({})).resolves.toEqual({});
    });

    it(`should return empty object with empty auth cookies for anon`, async () => {
      const session = await setup.createAnonymousSession();
      await expect(
        session.resources.oauth2.logout.postAuthCookies({
          token: undefined,
          refreshToken: undefined,
        }),
      ).resolves.toEqual({});
    });

    it(`should reject with long auth cookies`, async () => {
      await expect(
        adminSession.resources.oauth2.logout.postAuthCookies({
          token: maliciousData.longString,
          refreshToken: maliciousData.longString,
        }),
      ).rejects.toMatchInlineSnapshot(`[Error: Something went wrong calling the server (400)]`);
    });
  });
});
