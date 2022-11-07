import { logger } from '@aws-ee/common';
import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { runCommand } from '../util/run-command';
import { CliRunStep } from './cli-run.step';

export interface NpmScriptProps {
  cliPhase: CliPhase;
  scriptName: string;
  description: string;
  cwd: string;
  args?: string[];
}

export class NpmScriptStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: NpmScriptProps) {
    super(cmd, props.cliPhase);
  }

  info(): string {
    return this.props.description;
  }

  async run(): Promise<void> {
    if (this.skip) {
      logger.info('Skipping this step.');
      return;
    }
    const args = [this.props.scriptName];
    if (this.props.args) {
      args.push(...this.props.args);
    }
    await runCommand({
      command: 'pnpm',
      args,
      cwd: this.props.cwd,
    });
  }
}
