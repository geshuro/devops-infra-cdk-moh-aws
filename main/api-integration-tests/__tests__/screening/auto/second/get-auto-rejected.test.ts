/* eslint-disable jest/valid-describe */
import _ from 'lodash';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';
import { beforeAllScreeningTests, jwtAdminAndUser } from '../../../../support/util/util';

describe('GET /api/screening/:screeningId/second/autoRejected - Get auto rejected documents', () => {
  let setup;
  let adminSession;
  let userSession;
  let adminScreening;
  let userScreening;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeAll(async () => {
    setup = await runSetup();
    ({ adminSession, userSession, adminScreening, userScreening } = await beforeAllScreeningTests(
      setup,
      true /* shouldHaveSecondScreeningData */,
    ));
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should return auto rejected articles for admin user', async () =>
      expect(
        adminSession.resources.screenings.screening(adminScreening.id).secondAutoRejected.getTotalItems(),
      ).resolves.toBeGreaterThan(0));

    it('should return auto rejected articles for regular user', async () =>
      expect(
        userSession.resources.screenings.screening(userScreening.id).secondAutoRejected.getTotalItems(),
      ).resolves.toBeGreaterThan(0));
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, operationAttrs, spoofedJwtSubFn, code }) => {
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
        session.resources.screenings.screening(adminScreening.id).secondAutoRejected.getWithRetry(operationAttrs),
      ).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | operationAttrs    | code
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${{ page: 1000 }} | ${httpCode.unauthorized}
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${undefined}      | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description             | operationAttrs                                | code
    ${'XSS page'}           | ${{ page: maliciousData.xss }}                | ${httpCode.badRequest}
    ${'XSS itemsPerPage'}   | ${{ itemsPerPage: maliciousData.xss }}        | ${httpCode.badRequest}
    ${'XSS filter'}         | ${{ filter: maliciousData.xss }}              | ${httpCode.badRequest}
    ${'XSS search'}         | ${{ search: maliciousData.xss }}              | ${httpCode.badImplementation}
    ${'large page'}         | ${{ page: maliciousData.longNumber }}         | ${httpCode.uriTooLong}
    ${'large itemsPerPage'} | ${{ itemsPerPage: maliciousData.longString }} | ${httpCode.uriTooLong}
    ${'large filter'}       | ${{ filter: maliciousData.longString }}       | ${httpCode.uriTooLong}
    ${'large search'}       | ${{ search: maliciousData.longString }}       | ${httpCode.uriTooLong}
  `('Negative Tests', negativeTestFn);

  jwtAdminAndUser(() => adminSession.user.uid, describe, negativeTestFn);
});
