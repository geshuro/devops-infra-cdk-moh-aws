/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { userInfo } from 'os';
import { dirname, join } from 'path';

export function getStageConfig<T = any>(): T {
  const awsAccountId = process.env.AWS_ACCOUNT_ID;
  const envName = process.env.STAGE || userInfo().username;
  try {
    const stageConfig = require(`./stages/${envName}`);
    return { envName, awsAccountId, ...stageConfig.default };
  } catch {
    const expectedName = join(dirname(__filename), `./stages/${envName}.ts`);
    throw new Error(`Stage file not found at [${expectedName}]. Does it exist?`);
  }
}
