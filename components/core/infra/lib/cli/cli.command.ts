import type { Cli } from './cli';

export interface CliCommandProps {
  /**
   * The name of the command in a cli-friendly way, for example `deploy` or `info`
   */
  name: string | string[];

  /**
   * The description of the command as shown in the help screen
   */
  description: string;
}

export abstract class CliCommand {
  readonly name: string | string[];
  readonly description: string;
  private steps: unknown[] = [];

  constructor(cli: Cli, props: CliCommandProps) {
    this.name = props.name;
    this.description = props.description;
    cli.register(this);
  }

  abstract run(options: unknown): Promise<void>;

  register(step: unknown): void {
    this.steps.push(step);
  }

  getSteps<T>(): T[] {
    return this.steps as T[];
  }

  options(): { key: string; config: unknown }[] {
    return [];
  }
}
