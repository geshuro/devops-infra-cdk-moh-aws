/* eslint-disable no-console */
/* eslint-disable no-plusplus */
import { Lambda } from '@aws-sdk/client-lambda';
import { STS } from '@aws-sdk/client-sts';
import { IAM } from '@aws-sdk/client-iam';
import cliProgress from 'cli-progress';

type LocalDevEmulatorProps = {
  awsRegion: string;
  awsProfile: string;
  lambdaName: string;
};

type PolicyStatement = {
  Effect: 'Allow' | 'Deny';
  Principal?: {
    AWS?: string;
  };
  Action: string;
};

type Policy = {
  Statement: PolicyStatement[];
};

/**
 * Creates the environment for the locally run lambda.
 *
 * @returns Map with the environment that can be used for spawning the local child process for the lambda
 */
export async function renderEnvironment(props: LocalDevEmulatorProps): Promise<Record<string, string | undefined>> {
  const progressTotal = 6;
  let progressCurrent = 0;
  const progressBar = new cliProgress.SingleBar(
    {
      format: '[{bar}] {percentage}% | {msg}',
    },
    cliProgress.Presets.shades_classic,
  );
  process.env.AWS_REGION = props.awsRegion;
  process.env.AWS_PROFILE = props.awsProfile;

  let renderedEnv: Record<string, string | undefined> = { ...process.env };

  const lambda = new Lambda({});
  const sts = new STS({});
  const iam = new IAM({});

  progressBar.start(progressTotal, progressCurrent++, { msg: `Resolving AWS Account...` });

  /*
   * Resolve the AWS Account ID and partition of the current profile.
   * This is needed later for assembling an ARN.
   */
  const callerId = await sts.getCallerIdentity({});
  const [, awsPartition] = callerId.Arn!.split(':');
  const awsAccountId = callerId.Account!;

  /*
   * Download all environment variables of the deployed lambda.
   * These will be injected into the process environment of the local lambda.
   */
  progressBar.update(progressCurrent++, { msg: 'Loading environment settings from lambda...' });
  const getFunctionResult = await lambda.getFunction({
    FunctionName: props.lambdaName,
  });

  const lambdaEnv = getFunctionResult.Configuration?.Environment?.Variables ?? {};

  renderedEnv = { ...renderedEnv, ...lambdaEnv };

  /*
   * Getting the role document of the Lambda Execution role.
   */
  const roleArn = getFunctionResult.Configuration?.Role;
  const roleName = roleArn?.split('/')[1];
  progressBar.update(progressCurrent++, { msg: `Loading lambda execution role [${roleName}]...` });
  const iamResult = await iam.getRole({
    RoleName: roleName,
  });

  const assumeRolePolicy: Policy = JSON.parse(decodeURIComponent(iamResult.Role?.AssumeRolePolicyDocument ?? ''));

  const accountRootArn = `arn:${awsPartition}:iam::${awsAccountId}:root`;

  /*
   * In order to assume the Lambda Execution role locally, it must have an appropriate AssumeRolePolicy configured.
   * The statement we are scanning for is:
   * {
   *   Effect: 'Allow',
   *   Principal: {
   *     AWS: `arn:${awsPartition}:iam::${awsAccountId}:root`
   *   },
   *   Action: 'sts:AssumeRole',
   * }
   */
  progressBar.update(progressCurrent++, { msg: `Checking if Lambda execution role can be assumed locally...` });
  if (!assumeRolePolicy.Statement.some((stmt) => stmt.Principal?.AWS === accountRootArn)) {
    progressBar.update(progressCurrent++, { msg: `Extending Lambda execution role so it can be assumed locally...` });
    assumeRolePolicy.Statement.push({
      Effect: 'Allow',
      Principal: { AWS: accountRootArn },
      Action: 'sts:AssumeRole',
    });

    /*
     * If the statement above is not found, it has to be added to the AssumeRolePolicy.
     */
    await iam.updateAssumeRolePolicy({
      RoleName: roleName,
      PolicyDocument: JSON.stringify(assumeRolePolicy),
    });
    progressBar.stop();

    console.info(
      '\n✅ The Lambda role has been extended so it can be assumed locally. Stopping the emulator to force a new session...',
    );
    console.info('\n  It may take several seconds for this change to be applied, if the emulator crashes after this,');
    console.info('\n  please wait a few seconds and try again!');
    console.info('\n👉 Please start the emulator again.\n');
    process.exit(0);
  } else {
    progressBar.update(progressCurrent++, { msg: `Lambda execution role can already be assumed locally` });
  }

  /*
   * Get temporary credentials for the role from STS.
   * The maximum duration is by default 1h, so this is all we can relatively safely request.
   */
  progressBar.update(progressCurrent++, { msg: `Loading temporary credentials for the Lambda execution role...` });
  const assumeResult = await sts.assumeRole({
    RoleArn: roleArn,
    RoleSessionName: 'LocalDebugSession',
    DurationSeconds: 1 * 60 * 60, // 1h
  });

  /*
   * Add the temporary credentials to the environment of the local lambda using the
   * variables that the AWS SDK expects. This way all AWS calls will run under the assumed role.
   */
  renderedEnv.AWS_ACCESS_KEY_ID = assumeResult.Credentials?.AccessKeyId;
  renderedEnv.AWS_SECRET_ACCESS_KEY = assumeResult.Credentials?.SecretAccessKey;
  renderedEnv.AWS_SESSION_TOKEN = assumeResult.Credentials?.SessionToken;

  /*
   * The environment variable APP_RUN_MODE='local' can be used in the lambda code to detect if
   * it runs in the emulator.
   */
  renderedEnv.APP_RUN_MODE = 'local';

  /*
   * To make absolutely sure that the local lambda does not use the admin credentials of the
   * configured AWS profile, we remove all info about the profile from the environment.
   */
  delete renderedEnv.AWS_PROFILE;

  progressBar.update(progressCurrent++, {
    msg: 'Local node environment for running Lambda has been created successfully',
  });
  progressBar.stop();
  return renderedEnv;
}
