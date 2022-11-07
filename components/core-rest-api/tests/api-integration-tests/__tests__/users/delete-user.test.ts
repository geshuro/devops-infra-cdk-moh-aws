/* eslint-disable jest/valid-describe-callback */
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, maliciousData, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('DELETE /api/users/{uid} - Delete user', () => {
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
  const negativeTestFn = ({ description, sessionType = 'user', spoofedJwtSubFn, uidToUpdate, code }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = await setup.createSession(sessionType);

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Determine which user should be deleted
      let uid = uidToUpdate;
      if (_.isNil(uid)) {
        // If no UID was passed, create another user to delete
        const userSession = await setup.createSession('user');
        uid = userSession.user.uid;
      }

      // Make and check request
      let apiError;
      try {
        await session.resources.users.user(uid).delete();
      } catch (error) {
        apiError = error;
      }
      expect(apiError).toBeDefined();
      const expectedErrorCodes = Array.isArray(code) ? code : [code];
      expect(expectedErrorCodes).toContain(apiError.code);
    });
  };

  describe.each`
    description                  | sessionType    | code
    ${'unauthenticated request'} | ${'anonymous'} | ${httpCode.unauthorized}
    ${'regular user'}            | ${'user'}      | ${httpCode.forbidden}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description                         | spoofedJwtSubFn                | code
    ${'invalid JWT - existing user'}    | ${() => adminSession.user.uid} | ${httpCode.unauthorized}
    ${'invalid JWT - nonexisting user'} | ${uuid}                        | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description         | uidToUpdate                 | code
    ${'XSS HTTP path'}  | ${maliciousData.xss}        | ${httpCode.notFound}
    ${'long HTTP path'} | ${maliciousData.longString} | ${[httpCode.uriTooLong, httpCode.badRequest]}
  `('Negative Tests', negativeTestFn);

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('successfully deletes user', async () => {
      const [testAdminSession, testUserSession] = await Promise.all([
        setup.createSession('admin'),
        setup.createSession('user'),
      ]);

      const { uid } = testUserSession.user;
      await expect(testAdminSession.resources.users.user(uid).delete()).resolves.toMatchObject({});
    });
  });
});
