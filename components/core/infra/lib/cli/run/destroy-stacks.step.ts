import { logger } from '@aws-ee/common';
import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { runCommand } from '../util/run-command';
import { CliRunStep } from './cli-run.step';

export interface DestroyStacksProps {
  cliPhase: CliPhase;
  stackName: string;
  cwd: string;
  awsRegion: string;
  awsProfile: string;
}

export class DestroyStacksStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: DestroyStacksProps) {
    super(cmd, props.cliPhase);
  }

  info(): string {
    return `Destroying stacks [${this.props.stackName}]`;
  }

  async run(): Promise<void> {
    if (this.skip) {
      logger.info('Skipping this step.');
      return;
    }
    await runCommand({
      env: {
        AWS_REGION: this.props.awsRegion,
        AWS_PROFILE: this.props.awsProfile,
      },
      command: 'pnpm',
      args: ['cdk', '--', 'destroy', this.props.stackName],
      cwd: this.props.cwd,
    });
  }
}
