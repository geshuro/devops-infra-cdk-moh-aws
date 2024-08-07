/* eslint-disable jest/valid-describe */
import _ from 'lodash';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';
import { beforeAllScreeningTests, jwtAdminAndUser, sleep, getArticle } from '../../../../../support/util/util';

describe('GET /api/screening/:screeningId/decision/approve/:documentId - Get document approval', () => {
  let setup;
  let adminSession;
  let userSession;
  let adminScreening;
  let userScreening;
  let adminAutoApprovedArticle;
  let userAutoApprovedArticle;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeAll(async () => {
    setup = await runSetup();
    ({ adminSession, userSession, adminScreening, userScreening, adminAutoApprovedArticle, userAutoApprovedArticle } =
      await beforeAllScreeningTests(setup));
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    const approveDecisions = {
      manualDecisions: [
        {
          decision: 'approve',
        },
      ],
    };

    describe.each`
      description                                          | getScreeningId             | getArticleId                         | getSession
      ${'should return article approval for admin user'}   | ${() => adminScreening.id} | ${() => adminAutoApprovedArticle.id} | ${() => adminSession}
      ${'should return article approval for regular user'} | ${() => userScreening.id}  | ${() => userAutoApprovedArticle.id}  | ${() => userSession}
    `('approval', ({ description, getScreeningId, getArticleId, getSession }) => {
      it(description, async () => {
        const screeningId = getScreeningId();
        const articleId = getArticleId();
        const session = getSession();

        await expect(getArticle(session, screeningId, articleId)).resolves.toMatchObject({
          manualDecisions: [],
        });

        // approve an article
        await session.resources.screenings.screening(screeningId).decision('approve', articleId).get();

        // TODO: OS Delay encapsulate
        // give some time for newly created articles to be streamed into OpenSearch
        await sleep(5000);

        await expect(getArticle(session, screeningId, articleId)).resolves.toMatchObject(approveDecisions);
      });
    });
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, articleId, spoofedJwtSubFn, code }) => {
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
          .decision('approve', articleId || adminAutoApprovedArticle.id)
          .get(),
      ).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | articleId    | code
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${'foo'}     | ${httpCode.unauthorized}
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${undefined} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description          | articleId                   | code
    ${'XSS articleId'}   | ${maliciousData.xss}        | ${httpCode.notFound}
    ${'large articleId'} | ${maliciousData.longNumber} | ${httpCode.uriTooLong}
  `('Negative Tests', negativeTestFn);

  jwtAdminAndUser(() => adminSession.user.uid, describe, negativeTestFn);
});
