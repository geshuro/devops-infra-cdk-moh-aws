import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { runCommand } from '../util/run-command';
import { CliRunStep } from './cli-run.step';

export interface SynthProps {
  cliPhase: CliPhase;
  cwd: string;
  namespace: string;
}

export class CdkSynthStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: SynthProps) {
    super(cmd, props.cliPhase);
  }

  info(): string {
    return `Synthing CloudFormation Template`;
  }

  async run() {
    await runCommand({
      command: 'pnpm',
      args: ['cdk', '--', 'synth', '--quiet', '--toolkit-stack-name', `${this.props.namespace}-toolkit`],
      cwd: this.props.cwd,
    });
  }
}
