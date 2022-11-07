import { CliPhase } from '../cli-phases';
import { CliCommand } from '../cli.command';

export abstract class CliRunStep {
  protected skip = false;

  constructor(cmd: CliCommand, public readonly cliPhase: CliPhase) {
    cmd.register(this);
  }

  abstract run(options?: unknown): Promise<void>;

  abstract info(): string;

  setSkip(skip: boolean): void {
    this.skip = skip;
  }
}
