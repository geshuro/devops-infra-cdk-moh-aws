import { CoreStageConfig, EnvType } from '@aws-ee/core-infra';
import type { CoreRestApiStageConfig } from '@aws-ee/core-rest-api-infra';
import type { UiStageConfig } from '@aws-ee/core-ui-infra';
import type { CoreAuthCognitoStageConfig } from '@aws-ee/core-auth-cognito-infra';
import { OpenSearchApiStageConfig, OpenSearchMode } from '@aws-ee/opensearch-api-infra';

import { cloudFormationExecPolicyForPreProduction } from '../cf-exec-policies/pre';

type StageConfig = CoreStageConfig &
  CoreRestApiStageConfig &
  CoreAuthCognitoStageConfig &
  UiStageConfig &
  OpenSearchApiStageConfig;

const config: StageConfig = {
  awsRegion: 'eu-west-1',
  awsProfile: 'atos-moh-cdk-pre',
  solutionName: 'moh',
  solutionFullName: 'MoH Spain',
  versionDisclaimer: {
    header: 'Not for any critical, production, or otherwise important code, data, or other Content.',
    content:
      'This sample code is provided to you as AWS Content under the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). You should not use this sample code in your production accounts, or on production, or other critical data. You are responsible for testing, securing, and optimizing the sample code as appropriate for production grade use based on your specific quality control practices and standards. AWS may reuse these assets in future engagements, but we will not share your confidential data nor your intellectual property with other customers. Prototyping engagements are offered on a no-fee basis. However, you may incur AWS charges for creating or using AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.',
  },
  envType: EnvType.Dev,
  cloudFormationExecPolicy: cloudFormationExecPolicyForPreProduction,

  // Cognito
  adminPrincipals: [
    { email: 'isaac.mendoza.external@atos.net', firstName: 'Isaac', lastName: 'Mendoza' }],

  openSearchMode: OpenSearchMode.Create,
  /*imendoza enableSignUp: true, */
};


export default config;
