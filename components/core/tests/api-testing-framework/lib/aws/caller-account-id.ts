import type { STS } from 'aws-sdk';

/**
 * Returns the aws account id of the holder of the credentials
 */
export async function getCallerAccountId({ aws }: { aws: { sdk: { STS: new () => STS } } }): Promise<string> {
  const sts = new aws.sdk.STS();
  const response = await sts.getCallerIdentity().promise();
  return response.Account!;
}
