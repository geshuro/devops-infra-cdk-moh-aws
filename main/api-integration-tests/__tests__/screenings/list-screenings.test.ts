import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';

describe('GET /api/screenings - List screenings', () => {
  let setup;
  let adminSession;
  let userSession;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;

  beforeEach(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    userSession = await setup.createSession('user');
    const screening = await adminSession.resources.screenings.create();
    // Wait for the created screening to become available
    await adminSession.resources.screenings.includes(screening.id);
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should return a list of screenings for admin user', async () => {
      const screening = await adminSession.resources.screenings.create();
      await expect(adminSession.resources.screenings.includes(screening.id)).resolves.toBe(true);

      const screenings = await adminSession.resources.screenings.get();
      expect(screenings.items.map(screening => screening.id).includes(screening.id)).toBe(true);
    });

    it('should return a list of screenings for regular user', async () => {
      const screening = await userSession.resources.screenings.create();
      await expect(userSession.resources.screenings.includes(screening.id)).resolves.toBe(true);

      const screenings = await userSession.resources.screenings.get();
      expect(screenings.items.map(screening => screening.id).includes(screening.id)).toBe(true);
    });
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, operationAttrs, spoofedJwtSubFn, code }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = sessionType ? await setup.createSession(sessionType) : adminSession;

      // Create defaults, then override with defined parameter values
      const defaultOperationAttrs = { page: 1 };
      const customizedOperationAttrs = _.merge(defaultOperationAttrs, operationAttrs);

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Make and check request
      await expect(session.resources.screenings.get(customizedOperationAttrs)).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | operationAttrs    | code
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${{ page: 1000 }} | ${httpCode.unauthorized}
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${{}}             | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description             | operationAttrs                                | code
    ${'XSS page'}           | ${{ page: maliciousData.xss }}                | ${httpCode.badRequest}
    ${'XSS itemsPerPage'}   | ${{ itemsPerPage: maliciousData.xss }}        | ${httpCode.badRequest}
    ${'XSS search'}         | ${{ search: maliciousData.xss }}              | ${httpCode.badImplementation}
    ${'large page'}         | ${{ page: maliciousData.longNumber }}         | ${httpCode.uriTooLong}
    ${'large itemsPerPage'} | ${{ itemsPerPage: maliciousData.longString }} | ${httpCode.uriTooLong}
    ${'large search'}       | ${{ search: maliciousData.longString }}       | ${httpCode.uriTooLong}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description                                         | spoofedJwtSubFn                | code
    ${'invalid JWT (must run last) - nonexisting user'} | ${uuid}                        | ${httpCode.unauthorized}
    ${'invalid JWT (must run last) - existing user'}    | ${() => adminSession.user.uid} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);
});
