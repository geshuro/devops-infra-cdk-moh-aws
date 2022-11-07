import { STS } from '@aws-sdk/client-sts';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

interface ResolveAccountProps {
  awsProfile: string;
  awsRegion: string;
}

export async function resolveAwsAccount({ awsProfile, awsRegion }: ResolveAccountProps) {
  const client = new STS({
    region: awsRegion,
    credentials: defaultProvider({ profile: awsProfile }),
  });

  const result = await client.getCallerIdentity({});
  const [, awsPartition] = result.Arn!.split(':'); // detect AWS partition from the users arn
  return { awsAccountId: result.Account!, awsPartition };
}
