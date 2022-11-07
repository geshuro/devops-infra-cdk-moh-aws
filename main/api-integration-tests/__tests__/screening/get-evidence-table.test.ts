/* eslint-disable jest/valid-describe */

import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';

describe('GET /api/screening/:screeningId/evidenceTable - Get screening evidence table', () => {
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
  describe('Positive Tests', () => {
    const emptyEvidenceTable = {
      evidenceTable: 'title,author,abstract,url',
    };
    it('should return an evidence table for admin user', async () => {
      await expect(
        adminSession.resources.screenings.screening(adminScreening.id).evidenceTable.get(),
      ).resolves.toMatchObject(emptyEvidenceTable);
    });

    it('should return an evidence table for regular user', async () => {
      await expect(
        userSession.resources.screenings.screening(userScreening.id).evidenceTable.get(),
      ).resolves.toMatchObject(emptyEvidenceTable);
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
        session.resources.screenings.screening(screeningId || adminScreening.id).evidenceTable.get(),
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
