import { CliCommand } from '../cli.command';

export abstract class CliInfoStep {
  constructor(cmd: CliCommand) {
    cmd.register(this);
  }

  abstract info(): Promise<Record<string, string>>;
}
