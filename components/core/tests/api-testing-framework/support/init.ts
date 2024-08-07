import { getCallerAccountId } from '../lib/aws/caller-account-id';

const regionShortNamesMap = {
  'us-east-2': 'oh',
  'us-east-1': 'va',
  'us-west-1': 'ca',
  'us-west-2': 'or',
  'ap-east-1': 'hk',
  'ap-south-1': 'mum',
  'ap-northeast-3': 'osa',
  'ap-northeast-2': 'sel',
  'ap-southeast-1': 'sg',
  'ap-southeast-2': 'syd',
  'ap-northeast-1': 'ty',
  'ca-central-1': 'ca',
  'cn-north-1': 'cn',
  'cn-northwest-1': 'nx',
  'eu-central-1': 'fr',
  'eu-west-1': 'irl',
  'eu-west-2': 'ldn',
  'eu-west-3': 'par',
  'eu-north-1': 'sth',
  'me-south-1': 'bhr',
  'sa-east-1': 'sao',
  'us-gov-east-1': 'gce',
  'us-gov-west-1': 'gcw',
};

const deriveSettings = async ({ settings }) => {
  const awsAccountId = settings.get('awsAccountId');
  const envName = settings.get('envName');
  const awsRegion = settings.get('awsRegion');
  const solutionName = settings.get('solutionName');
  const awsRegionShortName = regionShortNamesMap[awsRegion];
  const namespace = `${envName}-${awsRegionShortName}-${solutionName}`;
  const globalNamespace = `${awsAccountId}-${namespace}`;
  const paramStoreRoot = `/${envName}/${solutionName}`;

  return {
    awsRegionShortName,
    namespace,
    globalNamespace,
    dbPrefix: namespace,
    paramStoreRoot,
  };
};

export async function init({ aws, settings }) {
  // Get the aws account id of the deployed solution (used as part of the global namespace)
  const awsAccountId = await getCallerAccountId({ aws });
  settings.set('awsAccountId', awsAccountId);

  // More settings to derive from existing settings, such as namespace, etc.
  const derivedSettings = await deriveSettings({ settings });
  settings.merge(derivedSettings);
}
