/* eslint-disable jest/valid-describe-callback */
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, maliciousData, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('POST /api/users - Create user', () => {
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
    sessionType = 'admin',
    spoofedJwtSubFn,
    userAttrs = { firstName: 'John', lastName: 'Snow' },
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
      const user = {
        ...userAttrs,
        email: setup.gen.username(),
      };
      await expect(session.resources.users.create(user)).rejects.toMatchObject({ code });
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
    description     | userAttrs                                  | code
    ${'XSS body'}   | ${{ firstName: maliciousData.xss }}        | ${httpCode.badRequest}
    ${'large body'} | ${{ firstName: maliciousData.longString }} | ${httpCode.payloadTooLarge}
  `('Negative Tests', negativeTestFn);

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('successfully creates user', async () => {
      const session = await setup.createSession('admin');

      const username = setup.gen.username();

      const user = {
        username,
        email: username,
        firstName: 'John',
        lastName: 'Snow',
      };
      await expect(session.resources.users.create(user)).resolves.toMatchObject(user);
    });
  });
});
