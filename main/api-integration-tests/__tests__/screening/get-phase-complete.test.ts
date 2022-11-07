/* eslint-disable jest/valid-describe */

import _ from 'lodash';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';
import { jwtAdminAndUser } from '../../support/util/util';

describe('GET /api/screening/:screeningId/phase1Complete|phase2Complete - Get phase complete 1|2', () => {
  let setup;
  let adminSession;
  let userSession;
  let adminScreening;
  let userScreening;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    userSession = await setup.createSession('user');
    adminScreening = await adminSession.resources.screenings.create();
    userScreening = await userSession.resources.screenings.create();

    // Wait for the created screenings to become available
    await adminSession.resources.screenings.includes(adminScreening.id);
    await userSession.resources.screenings.includes(userScreening.id);
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  // TODO: Add positive tests

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
      const screening = session.resources.screenings.screening(screeningId || adminScreening.id);
      const err = { code };
      await expect(screening.phase1Complete.get()).rejects.toMatchObject(err);
      await expect(screening.phase1Complete.get()).rejects.toMatchObject(err);
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

  jwtAdminAndUser(() => adminSession.user.uid, describe, negativeTestFn);
});
