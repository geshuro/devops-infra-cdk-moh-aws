import { PolicyDocument } from '@aws-cdk/aws-iam';

import { CliPhaseName } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { CloudFormationExecRoleHelper } from '../util/cloudformation-exec-policy';
import { resolveAwsAccount } from '../util/resolve-account';
import { runCommand } from '../util/run-command';
import { CliRunStep } from './cli-run.step';
import { cdkQualifier } from '../../infra/util/cdk-qualifier';

export interface CdkBootstrapStepProps {
  awsRegion: string;
  awsProfile: string;
  namespace: string;
  envName: string;
  solutionName: string;
  cwd: string;
  cloudFormationExecutionPolicyDoc: PolicyDocument;
}

export class CdkBootstrapStep extends CliRunStep {
  private trustedProfiles = new Set<string>();
  private account?: {
    awsAccountId: string;
    awsPartition: string;
  };
  private policy?: CloudFormationExecRoleHelper;

  constructor(cmd: CliCommand, private readonly props: CdkBootstrapStepProps) {
    super(cmd, CliPhaseName.Start);
  }

  info(): string {
    return 'Bootstrap CDK';
  }

  trustProfiles(...profiles: string[]): void {
    profiles.forEach((account) => this.trustedProfiles.add(account));
  }

  async run(): Promise<void> {
    await this.refreshAccountAndPolicy();

    await this.bootstrap(this.props.awsRegion);
  }

  private async refreshAccountAndPolicy() {
    this.account = await resolveAwsAccount({
      awsProfile: this.props.awsProfile,
      awsRegion: this.props.awsRegion,
    });
    this.policy = new CloudFormationExecRoleHelper({
      awsProfile: this.props.awsProfile,
      awsRegion: this.props.awsRegion,
      namespace: this.props.namespace,
      cloudFormationExecutionPolicyDoc: this.props.cloudFormationExecutionPolicyDoc,
      account: this.account,
    });
    await this.policy.createOrUpdatePolicy();
  }

  private async bootstrap(awsRegion: string): Promise<void> {
    const args = [
      'cdk',
      '--',
      'bootstrap',
      '--cloudformation-execution-policies',
      this.policy!.policyArn,
      '--toolkit-stack-name',
      `${this.props.namespace}-toolkit`,
      '--qualifier',
      cdkQualifier(`${this.props.envName}-${this.props.solutionName}`),
    ];

    if (this.trustedProfiles.size) {
      const trustedAccounts = (
        await Promise.all(
          [...this.trustedProfiles].map((profile) =>
            resolveAwsAccount({ awsProfile: profile, awsRegion: this.props.awsRegion }),
          ),
        )
      ).map((account) => account.awsAccountId);
      args.push('--trust', trustedAccounts.join(','));
    }

    await runCommand({
      command: 'pnpm',
      env: {
        CDK_NEW_BOOTSTRAP: '1',
        AWS_REGION: awsRegion,
        AWS_PROFILE: this.props.awsProfile,
      },
      args,
      cwd: this.props.cwd,
    });
  }
}
