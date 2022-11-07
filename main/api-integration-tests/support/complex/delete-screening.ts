/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const _ = require('lodash');

/**
 * @param { object, string } aws object, used to access run ID and DynamoDB, and id string for screening to delete;
 *                           for safety only deletes screening if its clinical question includes the run ID
 * @returns Promise<void> */
async function deleteScreening({ aws, id = '' }): Promise<void> {
  const runId = aws.settings.get('runId');
  const db = await aws.services.dynamoDb();

  const screening = await db.tables.screenings.getter().key({ id }).get();

  if (_.isEmpty(screening)) {
    console.log(`Screening with id "${id}" does not exist, skipping the deletion of this screening`);
    return;
  }

  const clinicalQuestion = screening.clinicalQuestion || '';

  if (!clinicalQuestion.includes(runId)) {
    console.log(
      `Screening clinicalQuestion "${clinicalQuestion}" does not contain the runId "${runId}", skipping the deletion of this screening as a measure of caution`,
    );

    return;
  }

  await db.tables.screenings.deleter().key({ id }).delete();
}

module.exports = { deleteScreening };
