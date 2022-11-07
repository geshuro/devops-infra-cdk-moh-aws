import { PolicyDocument } from '@aws-cdk/aws-iam';
import { Region } from '@aws-ee/common';

export interface CoreStageConfig {
  /**
   * Target AWS region. Note that some global system components
   * (e.g. Lambda@Edge) are always deployed via a stack in us-east-1 no matter the setting here.
   */
  awsRegion: Region;

  /**
   * AWS profile to use for deployment; if not specified here, defaults to using the same credentials
   * the AWS CLI is set up to use (either a profile in ~/.aws/config or an instance role if on EC2).
   */
  awsProfile: string;

  /**
   * The short solution name is used to namespace a few AWS resources. Try to keep this
   * setting short to avoid hitting long strings issues; the default should be fine in most cases,
   * but if multiple separate instances of the system are deployed within a single account,
   * this name can be changed to ensure they are disambiguated.
   */
  solutionName: string;

  /**
   * The environment type (e.g. dev, demo, prod). This is for grouping multiple environments
   * into types. For example, all developers' environments can be of type "dev". This can be
   * used for enabling conditionals in code that might need to be different between dev and
   * production builds (for example, enabling CORS for localhost for local development).
   * Defaults to prod if unspecified.
   */
  envType: EnvType;

  /**
   * The role that CloudFormation assumes when executing links to this policy.
   */
  cloudFormationExecPolicy: PolicyDocument;
}

export enum EnvType {
  /**
   * The Dev environment relaxes some security settings to enable
   * local development. It should never be used for a production account.
   */
  Dev = 'dev',
  Prod = 'prod',
  Demo = 'demo',
  Pre = 'pre',
}
