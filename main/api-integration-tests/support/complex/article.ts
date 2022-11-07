/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */

/**
 *
 * @param { object, string, object } object used to access DynamoDB
 *                                   string id of article to create
 *                                   object containing article to create
 * @returns                          Promise<void> */
async function createArticle({ aws, id, articleRecord = {} }): Promise<void> {
  const db = await aws.services.dynamoDb();
  await db.tables.article.updater().key({ id }).item(articleRecord).update();
}

/**
 * @description              deletes specified article; for safety only proceeds if its abstract contains the run id
 * @param { object, string } object used to access run ID and DynamoDB
 *                           string id of article to delete;
 * @returns                  Promise<void> */
async function deleteArticle({ aws, id = '' }): Promise<void> {
  const runId = aws.settings.get('runId');
  const db = await aws.services.dynamoDb();

  const article = await db.tables.article.getter().key({ id }).get();

  if (!article) {
    console.log(`Article with id "${id}" does not exist, skipping the deletion of this article`);
    return;
  }

  const abstract = article.abstract || '';

  if (!abstract.includes(runId)) {
    console.log(
      `Article abstract "${abstract}" does not contain the runId "${runId}", skipping the deletion of this abstract as a measure of caution`,
    );

    return;
  }

  await db.tables.article.deleter().key({ id }).delete();
}

module.exports = { createArticle, deleteArticle };
