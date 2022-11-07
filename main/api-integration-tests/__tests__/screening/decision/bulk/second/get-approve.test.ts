/* eslint-disable jest/valid-describe */
import _ from 'lodash';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';
import {
  beforeAllScreeningTests,
  isEveryDecision,
  jwtAdminAndUser,
  sleep,
  createArticlesWithDifferentDecisionsSecondScreening,
} from '../../../../../support/util/util';

describe('GET /api/screening/:screeningId/second/decision/bulk/approve - Get bulk document approval', () => {
  let setup;
  let adminSession;
  let userSession;
  let adminScreening;
  let userScreening;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeAll(async () => {
    setup = await runSetup();
    ({ adminSession, userSession, adminScreening, userScreening } = await beforeAllScreeningTests(setup));
    await createArticlesWithDifferentDecisionsSecondScreening(setup, adminSession, adminScreening.id);
    await createArticlesWithDifferentDecisionsSecondScreening(setup, userSession, userScreening.id);
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    describe.each`
      description                                                  | getScreeningId             | getSession
      ${'should return all articles as approved for admin user'}   | ${() => adminScreening.id} | ${() => adminSession}
      ${'should return all articles as approved for regular user'} | ${() => userScreening.id}  | ${() => userSession}
    `('approval', ({ description, getScreeningId, getSession }) => {
      it(description, async () => {
        const screeningId = getScreeningId();
        const session = getSession();

        // approve all articles on the page determined by a query.
        // we make an assumption we have only a few articles, so there's no pagination involved, thus the query with only a mandatory parameter
        const query = { autoDecision: 'approved' };
        await session.resources.screenings.screening(screeningId).secondBulkDecision('approve', query).get();

        // TODO: OS Delay encapsulate
        // give some time for newly created articles to be streamed into OpenSearch
        await sleep(5000);

        const autoApprovedResponse = await session.resources.screenings
          .screening(screeningId)
          .secondAutoApproved.getWithRetry();
        expect(isEveryDecision(autoApprovedResponse.items, 'approve', 'secondManualDecisions')).toBe(true);
      });
    });
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, autoDecision, spoofedJwtSubFn, code }) => {
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
        session.resources.screenings
          .screening(adminScreening.id)
          .secondBulkDecision('approve', { autoDecision: autoDecision || 'rejected' })
          .get(),
      ).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | autoDecision | code
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${'foo'}     | ${httpCode.unauthorized}
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${undefined} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description             | autoDecision                | code
    ${'XSS autoDecision'}   | ${maliciousData.xss}        | ${httpCode.badRequest}
    ${'large autoDecision'} | ${maliciousData.longNumber} | ${httpCode.uriTooLong}
  `('Negative Tests', negativeTestFn);

  jwtAdminAndUser(() => adminSession.user.uid, describe, negativeTestFn);
});
