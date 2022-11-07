import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';
import { CliRunStep } from './cli-run.step';

export interface CustomStepProps {
  cliPhase: CliPhase;
  description: string;
  run: () => Promise<void>;
}

export class CustomStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: CustomStepProps) {
    super(cmd, props.cliPhase);
  }

  async run() {
    await this.props.run();
  }

  info() {
    return this.props.description;
  }
}
