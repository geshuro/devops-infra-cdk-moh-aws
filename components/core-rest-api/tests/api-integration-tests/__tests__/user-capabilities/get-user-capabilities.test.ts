import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { runSetup, errorCode, utils } from '@aws-ee/api-testing-framework';

const httpCode = errorCode.http.code;
const { jwtTamper } = utils;

describe('GET /api/user-capabilities - List user capabilities', () => {
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
   * Note: This endpoint is deprecated and will only ever return an empty array
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
      await expect(session.resources.userCapabilities.get()).rejects.toMatchObject({ code });
    });
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should return a list of user capabilities', async () => {
      const session = await setup.createSession('admin');
      const listCapabilities = await session.resources.userCapabilities.get();

      expect(listCapabilities).toHaveProperty('items');
      _.forEach(listCapabilities.items, (capability) => {
        expect(capability).toHaveProperty('id');
        expect(capability).toMatchObject({ entityType: 'capability' });
      });
    });
  });
});
