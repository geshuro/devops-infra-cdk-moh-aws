import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('GET /api/user-roles - List user roles', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Negative Tests
   */
  describe.each`
    description                         | sessionType    | spoofedJwtSubFn                | code
    ${'unauthenticated request'}        | ${'anonymous'} | ${undefined}                   | ${httpCode.unauthorized}
    ${'invalid JWT - existing user'}    | ${'user'}      | ${() => adminSession.user.uid} | ${httpCode.unauthorized}
    ${'invalid JWT - nonexisting user'} | ${'user'}      | ${uuid}                        | ${httpCode.unauthorized}
  `('Negative Tests', ({ description, sessionType, spoofedJwtSubFn, code }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = await setup.createSession(sessionType);

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Make and check request
      await expect(session.resources.userRoles.get()).rejects.toMatchObject({ code });
    });
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should return a list of user roles', async () => {
      const session = adminSession;
      const listRoles = await session.resources.userRoles.get();

      expect(listRoles).toHaveProperty('items');
      _.forEach(listRoles.items, (role) => {
        expect(role).toHaveProperty('id');
      });
    });
  });
});
