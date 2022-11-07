/* eslint-disable jest/valid-describe */
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';

describe('GET /api/screening - Get screening', () => {
  let setup;
  let adminSession;
  let userSession;
  let adminScreening;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    userSession = await setup.createSession('user');
    adminScreening = await adminSession.resources.screenings.create();
    // Wait for the created screening to become available
    await adminSession.resources.screenings.includes(adminScreening.id);
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should return a screening for admin user', async () => {
      const screening = await adminSession.resources.screenings.create();
      await expect(adminSession.resources.screenings.includes(screening.id)).resolves.toBe(true);

      // The above screenings.includes waits for the created screening to become available, ensuring the following
      // does not fail spuriously due to delays in the created screening appearing
      await expect(adminSession.resources.screenings.screening(screening.id).get()).resolves.toMatchObject(screening);
    });

    it('should return a screening for regular user', async () => {
      const screening = await userSession.resources.screenings.create();
      await expect(userSession.resources.screenings.includes(screening.id)).resolves.toBe(true);

      // The above screenings.includes waits for the created screening to become available, ensuring the following
      // does not fail spuriously due to delays in the created screening appearing
      await expect(userSession.resources.screenings.screening(screening.id).get()).resolves.toMatchObject(screening);
    });
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, screeningId, spoofedJwtSubFn, code }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = sessionType ? await setup.createSession(sessionType) : adminSession;

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Make and check request
      await expect(
        session.resources.screenings.screening(screeningId || adminScreening.id).get(),
      ).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | screeningId  | code
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${'foo'}     | ${httpCode.unauthorized}
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${undefined} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description            | screeningId                 | code
    ${'XSS screeningId'}   | ${maliciousData.xss}        | ${httpCode.notFound}
    ${'large screeningId'} | ${maliciousData.longNumber} | ${httpCode.uriTooLong}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description                                         | spoofedJwtSubFn                | code
    ${'invalid JWT (must run last) - nonexisting user'} | ${uuid}                        | ${httpCode.unauthorized}
    ${'invalid JWT (must run last) - existing user'}    | ${() => adminSession.user.uid} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);
});
