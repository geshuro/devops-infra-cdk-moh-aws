/* eslint-disable jest/valid-describe-callback */
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, maliciousData, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('PUT /api/user - Update current user', () => {
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

      // Make and check request
      const requestBody = updates;
      await expect(session.resources.currentUser.update(requestBody)).rejects.toMatchObject({ code });
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
    description                         | sessionType | updates                                    | code
    ${'XSS body'}                       | ${'user'}   | ${{ firstName: maliciousData.xss }}        | ${httpCode.badRequest}
    ${'large body'}                     | ${'user'}   | ${{ firstName: maliciousData.longString }} | ${httpCode.payloadTooLarge}
    ${'restricted field - userRole'}    | ${'user'}   | ${{ userRoles: ['admin'] }}                | ${httpCode.forbidden}
    ${'active user status to disabled'} | ${'user'}   | ${{ enabled: false }}                      | ${httpCode.forbidden}
  `('Negative Tests', negativeTestFn);

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('successfully updates session user', async () => {
      const session = await setup.createSession('user');

      await expect(
        session.resources.currentUser.update({ firstName: 'John', lastName: 'Snow' }),
      ).resolves.toMatchObject({
        firstName: 'John',
        lastName: 'Snow',
      });
    });
  });
});
