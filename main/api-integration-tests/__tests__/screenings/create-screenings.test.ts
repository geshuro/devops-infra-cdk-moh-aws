import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { errorCode, maliciousData, runSetup, utils } from '@aws-ee/api-testing-framework';

describe('POST /api/screenings - Create screenings', () => {
  let setup;
  let adminSession;
  let userSession;
  const httpCode = errorCode.http.code;
  const { jwtTamper } = utils;
  const defaultPicoP = 'fooBar';

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    userSession = await setup.createSession('user');
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  /**
   * Positive Tests
   */
  describe('Positive Tests', () => {
    it('should create a screening for admin user', async () => {
      const screening = await adminSession.resources.screenings.create();
      await expect(adminSession.resources.screenings.includes(screening.id)).resolves.toBe(true);
    });

    it('should create a screening for regular user', async () => {
      const screening = await userSession.resources.screenings.create({ picoP: defaultPicoP });
      await expect(userSession.resources.screenings.includes(screening.id)).resolves.toBe(true);
    });
  });

  /**
   * Negative Tests
   */
  const negativeTestFn = ({ description, sessionType, operationAttrs, spoofedJwtSubFn, code }) => {
    it(`rejects "${description}" request with "${code}"`, async () => {
      // Create session
      const session = sessionType ? await setup.createSession(sessionType) : adminSession;

      // Create defaults using the setup object, which is unavailable until run time, then override with defined parameter values
      const gen = setup.gen;
      const defaultOperationAttrs = {
        clinicalQuestion: gen.description(),
        keywords: gen.string(),
        picoP: gen.string(),
        picoI: gen.string(),
        picoC: gen.string(),
        picoO: gen.string(),
        picoD: gen.string(),
      };
      const customizedOperationAttrs = _.merge(defaultOperationAttrs, operationAttrs);

      // Update JWT if necessary
      if (!_.isNil(spoofedJwtSubFn)) {
        const spoofedSub = spoofedJwtSubFn();
        await session.updateIdToken(jwtTamper(session.idToken, { bodyUpdates: { sub: spoofedSub } }));
      }

      // Make and check request
      await expect(session.resources.screenings.create(customizedOperationAttrs)).rejects.toMatchObject({ code });
    });
  };

  describe.each`
    description                                     | sessionType    | operationAttrs             | code
    ${'unauthenticated request, existent data'}     | ${'anonymous'} | ${{ picoP: defaultPicoP }} | ${httpCode.unauthorized}
    ${'unauthenticated request, non-existent data'} | ${'anonymous'} | ${undefined}               | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);

  // not including XSS tests, because there's no explicit XSS payload rejection, as it's not required

  describe.each`
    description                 | operationAttrs                                    | code
    ${'large clinicalQuestion'} | ${{ clinicalQuestion: maliciousData.longString }} | ${httpCode.payloadTooLarge}
    ${'large keywords'}         | ${{ keywords: maliciousData.longString }}         | ${httpCode.payloadTooLarge}
    ${'large picoP'}            | ${{ picoP: maliciousData.longString }}            | ${httpCode.payloadTooLarge}
    ${'large picoI'}            | ${{ picoI: maliciousData.longString }}            | ${httpCode.payloadTooLarge}
    ${'large picoC'}            | ${{ picoC: maliciousData.longString }}            | ${httpCode.payloadTooLarge}
    ${'large picoO'}            | ${{ picoO: maliciousData.longString }}            | ${httpCode.payloadTooLarge}
    ${'large picoD'}            | ${{ picoD: maliciousData.longString }}            | ${httpCode.payloadTooLarge}
  `('Negative Tests', negativeTestFn);

  describe.each`
    description                                         | spoofedJwtSubFn                | code
    ${'invalid JWT (must run last) - nonexisting user'} | ${uuid}                        | ${httpCode.unauthorized}
    ${'invalid JWT (must run last) - existing user'}    | ${() => adminSession.user.uid} | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);
});
