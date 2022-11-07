import Table from 'cli-table3';
import { Injectable } from '@nestjs/common';

import { Cli } from './cli';
import { CliCommand } from './cli.command';
import { CliInfoStep } from './info/cli-info.step';

@Injectable()
export class InfoCommand extends CliCommand {
  constructor(cli: Cli) {
    super(cli, {
      name: ['show-solution-info', 'info'],
      description: 'Displays information about the solution',
    });
  }

  async run() {
    // run all info steps in parallel
    const info = (await Promise.all(this.getSteps<CliInfoStep>().map((step) => step.info()))).reduce(
      (prev, curr) => ({ ...prev, ...curr }),
      {},
    );

    const table = new Table({
      chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });
    table.push(...Object.entries(info));

    console.log(table.toString());
  }
}
