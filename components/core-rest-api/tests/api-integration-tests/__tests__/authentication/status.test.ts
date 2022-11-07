import _ from 'lodash';
import { runSetup, errorCode, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('GET /api/authentication/status', () => {
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
    it(`should return status for authenticated user`, async () => {
      await expect(adminSession.resources.authentication.status.get()).resolves.toMatchObject({});
    });
  });

  describe(`Negative`, () => {
    it(`should reject for anon`, async () => {
      const session = await setup.createAnonymousSession();
      await expect(session.resources.authentication.status.get()).rejects.toMatchObject({
        code: httpCode.unauthorized,
      });
    });

    it(`should reject for random token`, async () => {
      const session = await setup.createUserSession();
      await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: setup.gen.string() } }));

      await expect(session.resources.authentication.status.get()).rejects.toMatchObject({
        code: httpCode.unauthorized,
      });
    });
  });
});
