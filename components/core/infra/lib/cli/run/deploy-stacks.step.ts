import { logger } from '@aws-ee/common';
import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { runCommand } from '../util/run-command';
import { CliRunStep } from './cli-run.step';

export interface DeployStacksProps {
  cliPhase: CliPhase;
  stackName: string;
  cwd: string;
  namespace: string;
  awsRegion: string;
  awsProfile: string;
  hotswap?: boolean;
}

export class DeployStacksStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: DeployStacksProps) {
    super(cmd, props.cliPhase);
  }

  info(): string {
    return `Deploying stacks [${this.props.stackName}]`;
  }

  async run(): Promise<void> {
    if (this.skip) {
      logger.info('Skipping this step.');
      return;
    }
    const args = [
      'cdk',
      '--',
      'deploy',
      this.props.stackName,
      '--outputs-file',
      'cdk-out.json',
      '--require-approval',
      'never',
      '--toolkit-stack-name',
      `${this.props.namespace}-toolkit`,
    ];

    if (this.props.hotswap && process.env.SSTX_CDK_HOTSWAP !== 'off') {
      args.push('--hotswap');
    }

    await runCommand({
      env: {
        AWS_REGION: this.props.awsRegion,
        AWS_PROFILE: this.props.awsProfile,
      },
      command: 'pnpm',
      args,
      cwd: this.props.cwd,
    });
  }
}
