/* eslint-disable jest/valid-describe-callback */
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, maliciousData, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('PUT /api/users/{uid} - Update user', () => {
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
  const negativeTestFn = ({
    description,
    sessionType = 'user',
    spoofedJwtSubFn,
    uidToUpdate,
    updates = { firstName: 'John', lastName: 'Snow' },
    code,
  }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = await setup.createSession(sessionType);

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Determine which user should be updated
      let uid = uidToUpdate;
      if (_.isNil(uid)) {
        // If uidToUpdate wasn't passed, update self
        uid = _.get(session, 'user.uid');
        if (_.isNil(uid)) {
          // If self session is anonymous, create a new user to be updated
          const userSession = await setup.createSession('user');
          uid = userSession.user.uid;
        }
      }

      // Make and check request
      const requestBody = updates;
      let apiError;
      try {
        await session.resources.users.user(uid).update(requestBody);
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

  describe.each`
    description                         | sessionType | updates                                    | code
    ${'XSS body'}                       | ${'user'}   | ${{ firstName: maliciousData.xss }}        | ${httpCode.badRequest}
    ${'large body'}                     | ${'user'}   | ${{ firstName: maliciousData.longString }} | ${httpCode.payloadTooLarge}
    ${'restricted field - userRole'}    | ${'user'}   | ${{ userRoles: ['admin'] }}                | ${httpCode.forbidden}
    ${'active user status to disabled'} | ${'user'}   | ${{ enabled: false }}                      | ${httpCode.forbidden}
  `('Negative Tests', negativeTestFn);

  it('rejects "non-admin update of another user" with "forbidden"', async () => {
    // Create session
    const [session1, session2] = await Promise.all([setup.createSession('user'), setup.createSession('user')]);

    // Make and check request
    const updates = { firstName: 'John', lastName: 'Snow' };
    const { uid } = session2.user;
    const requestBody = updates;
    await expect(session1.resources.users.user(uid).update(requestBody)).rejects.toMatchObject({
      code: httpCode.forbidden,
    });
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('successfully updates session user', async () => {
      const session = await setup.createSession('user');

      const { uid } = session.user;
      await expect(
        session.resources.users.user(uid).update({ firstName: 'John', lastName: 'Snow' }),
      ).resolves.toMatchObject({
        firstName: 'John',
        lastName: 'Snow',
      });
    });

    it('successfully updates another user as admin', async () => {
      const userSession = await setup.createSession('user');

      const { uid } = userSession.user;
      await expect(
        adminSession.resources.users.user(uid).update({ firstName: 'John', lastName: 'Snow' }),
      ).resolves.toMatchObject({
        firstName: 'John',
        lastName: 'Snow',
      });
    });
  });
});
