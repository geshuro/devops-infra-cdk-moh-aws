import { Lambda } from '@aws-sdk/client-lambda';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { logger } from '@aws-ee/common';

import { CliPhase } from '../cli-phases';
import { CliRunStep } from './cli-run.step';
import { CliCommand } from '../cli.command';

export interface InvokeLambdaProps {
  cliPhase: CliPhase;
  lambdaName: string;
}

export class InvokeLambdaStep extends CliRunStep {
  constructor(cmd: CliCommand, private props: InvokeLambdaProps) {
    super(cmd, props.cliPhase);
  }

  info(): string {
    return `Invoke lambda [${this.props.lambdaName}]`;
  }

  async run() {
    const result = await this.lambdaClient.invoke({
      FunctionName: this.props.lambdaName,
    });
    if (result.FunctionError) {
      throw new Error(`Invoking the Lambda has failed [${result.FunctionError}] Please check the relevant logs`);
    }
    logger.info('The Lambda has run successfully');
  }

  private _lambdaClient?: Lambda;

  private get lambdaClient() {
    if (!this._lambdaClient) {
      const profile = process.env.AWS_PROFILE;
      const region = process.env.AWS_REGION;
      this._lambdaClient = new Lambda({
        region,
        credentials: defaultProvider({ profile }),
      });
    }
    return this._lambdaClient;
  }
}
