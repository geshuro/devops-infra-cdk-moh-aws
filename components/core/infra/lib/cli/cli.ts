import { Injectable } from '@nestjs/common';

import type { CliCommand } from './cli.command';

@Injectable()
export class Cli {
  private cmds: CliCommand[] = [];

  register(cmd: CliCommand): void {
    this.cmds.push(cmd);
  }

  commands(): CliCommand[] {
    return this.cmds;
  }
}
