const uuid = require('uuid');
const { errorCode } = require('@aws-ee/api-testing-framework');

const sleep = durationMs => new Promise(resolve => setTimeout(resolve, durationMs));

const beforeAllScreeningTests = async (setup, shouldHaveSecondScreeningData = false) => {
  const adminSession = await setup.defaultAdminSession();
  const userSession = await setup.createSession('user');
  const adminScreening = await adminSession.resources.screenings.create();
  const userScreening = await userSession.resources.screenings.create();

  // Create screening articles of all three types (approve, reject, reset) for admin and regular user
  const adminAutoApprovedArticle = await adminSession.resources.screenings
    .screening(adminScreening.id)
    .article(setup.gen.string())
    .createAutoApproved();
  const adminAutoRejectedArticle = await adminSession.resources.screenings
    .screening(adminScreening.id)
    .article(setup.gen.string())
    .createAutoRejected();

  const userAutoApprovedArticle = await userSession.resources.screenings
    .screening(userScreening.id)
    .article(setup.gen.string())
    .createAutoApproved();
  const userAutoRejectedArticle = await userSession.resources.screenings
    .screening(userScreening.id)
    .article(setup.gen.string())
    .createAutoRejected();

  if (shouldHaveSecondScreeningData) {
    // add delay, as DynamoDB is eventually consistent and articles might not have appeared yet
    await sleep(2000);

    // only manually approved articles in first screening will show up in results for second screening, so approve them
    await adminSession.resources.screenings
      .screening(adminScreening.id)
      .decision('approve', adminAutoApprovedArticle.id)
      .get();
    await adminSession.resources.screenings
      .screening(adminScreening.id)
      .decision('approve', adminAutoRejectedArticle.id)
      .get();
    await userSession.resources.screenings
      .screening(userScreening.id)
      .decision('approve', userAutoApprovedArticle.id)
      .get();
    await userSession.resources.screenings
      .screening(userScreening.id)
      .decision('approve', userAutoRejectedArticle.id)
      .get();
  }

  // TODO: OS Delay encapsulate this to make more transparent to callers
  // give some time for newly created articles to be streamed into OpenSearch
  await sleep(2000);

  return {
    adminAutoApprovedArticle,
    adminAutoRejectedArticle,
    userAutoApprovedArticle,
    userAutoRejectedArticle,
    adminSession,
    userSession,
    adminScreening,
    userScreening,
  };
};

// inspired by `beforeAllScreeningTests`
const createArticlesWithDifferentDecisions = async (setup, session, screeningId) => {
  // doesn't matter for decision testing, but let's create all articles in autoApproved tab
  const articleManuallyApproved = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();
  const articleManuallyRejected = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();
  const articleNoDecision = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();

  await sleep(2000);

  await session.resources.screenings.screening(screeningId).decision('approve', articleManuallyApproved.id).get();
  await session.resources.screenings.screening(screeningId).decision('reject', articleManuallyRejected.id).get();

  await sleep(2000);

  return [articleManuallyApproved, articleManuallyRejected, articleNoDecision];
};
const createArticlesWithDifferentDecisionsSecondScreening = async (setup, session, screeningId) => {
  // doesn't matter for decision testing, but let's create all articles in autoApproved tab
  const articleManuallyApprovedSecond = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();
  const articleManuallyRejectedSecond = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();
  const articleNoDecisionSecond = await session.resources.screenings
    .screening(screeningId)
    .article(setup.gen.string())
    .createAutoApproved();

  await sleep(2000);

  // approve all as that's a condition for articles to appear in second screening
  await session.resources.screenings.screening(screeningId).decision('approve', articleManuallyApprovedSecond.id).get();
  await session.resources.screenings.screening(screeningId).decision('approve', articleManuallyRejectedSecond.id).get();
  await session.resources.screenings.screening(screeningId).decision('approve', articleNoDecisionSecond.id).get();

  await sleep(2000);

  // make second screening decisions
  await session.resources.screenings
    .screening(screeningId)
    .secondDecision('approve', articleManuallyApprovedSecond.id)
    .get();
  await session.resources.screenings
    .screening(screeningId)
    .secondDecision('reject', articleManuallyRejectedSecond.id)
    .get();

  await sleep(2000);

  return [articleManuallyApprovedSecond, articleManuallyRejectedSecond, articleNoDecisionSecond];
};

const isEveryDecision = (items, decisionValue, decisionsKey = 'manualDecisions') => {
  if (items.length === 0) {
    throw new Error('there must be some articles present');
  }
  return items
    .flatMap(a => a[decisionsKey])
    .map(a => a.decision)
    .every(a => a === decisionValue);
};

const jwtAdminAndUser = (adminUidFn, describe, negativeTestFn) => {
  const httpCode = errorCode.http.code;

  describe.each`
    description                                         | spoofedJwtSubFn | code
    ${'invalid JWT (must run last) - nonexisting user'} | ${uuid.v4}      | ${httpCode.unauthorized}
    ${'invalid JWT (must run last) - existing user'}    | ${adminUidFn}   | ${httpCode.unauthorized}
  `('Negative Tests', negativeTestFn);
};

/**
 * there's no `/article` API, but we can check content of a screening page.
 * given our test data is tiny and we don't paginate, it's enough to know
 * whether the article was auto approved or rejected to find it.
 */
const getArticle = async (session, screeningId, articleId) => {
  const autoApproved = await session.resources.screenings.screening(screeningId).autoApproved.getWithRetry();
  const autoRejected = await session.resources.screenings.screening(screeningId).autoRejected.getWithRetry();
  const maybeAutoApprovedArticle = autoApproved.items.find(item => item.id === articleId);
  const maybeAutoRejectedArticle = autoRejected.items.find(item => item.id === articleId);
  return maybeAutoApprovedArticle || maybeAutoRejectedArticle;
};

module.exports = {
  createArticlesWithDifferentDecisions,
  createArticlesWithDifferentDecisionsSecondScreening,
  beforeAllScreeningTests,
  isEveryDecision,
  jwtAdminAndUser,
  sleep,
  getArticle,
};
