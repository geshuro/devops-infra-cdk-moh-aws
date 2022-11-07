import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('GET /api/users - List users', () => {
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
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Make and check request
      await expect(session.resources.users.get()).rejects.toMatchObject({ code });
    });
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    // List users as admin
    it('should return a list of users', async () => {
      const session = await setup.createSession('admin');
      const listUsersResult = await session.resources.users.get();

      expect(listUsersResult).toHaveProperty('items');
      _.forEach(listUsersResult.items, (user) => {
        expect(user).toHaveProperty('uid');
      });
    });

    // List users as normal user
    it('should return a list of users with "userRole" omitted', async () => {
      const session = await setup.createSession('user');
      const listUsersResult = await session.resources.users.get();

      expect(listUsersResult).toHaveProperty('items');
      _.forEach(listUsersResult.items, (user) => {
        expect(user).toHaveProperty('uid');
        expect(user).not.toHaveProperty('userRole');
      });
    });
  });
});
