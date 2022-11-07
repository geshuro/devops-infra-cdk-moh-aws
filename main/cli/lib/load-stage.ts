import figlet from 'figlet';
import chalk from 'chalk';
import { userInfo } from 'os';
import { getStageConfig } from '@aws-ee/config';
import { resolveAwsAccount } from '@aws-ee/core-infra';
import { logger } from '@aws-ee/common';

// eslint-disable-next-line consistent-return
export async function loadStage(stage?: string): Promise<unknown> {
  const safeStage = resolveStageName(stage);
  try {
    process.env.STAGE = safeStage;
    const env = getStageConfig();
    process.env.AWS_REGION = env.awsRegion;
    process.env.AWS_PROFILE = env.awsProfile;
    const { awsAccountId } = await resolveAwsAccount({
      awsProfile: process.env.AWS_PROFILE!,
      awsRegion: process.env.AWS_REGION!,
    });
    process.env.AWS_ACCOUNT_ID = awsAccountId;
    if (env.solutionName) {
      logger.log(figlet.textSync(env.solutionName, { font: 'Standard' }));
    }
    logger.info(`Using stage [${chalk.blueBright(safeStage)}]\n`);
    return { ...env, awsAccountId };
  } catch (err) {
    logger.error(err as string);
    logger.error(
      `Failed to load stage [${safeStage}]. The config file for this stage was either not found or contains errors. Check the output above for more info.`,
    );
    process.exit(1);
  }
}

const resolveStageName = (stage?: string) => stage ?? userInfo().username;
