import chalk from 'chalk';
import { SSM } from '@aws-sdk/client-ssm';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

import { CliInfoStep } from './cli-info.step';
import { InfoCommand } from '../info.command';

interface SsmParameterStepProps {
  parameterName: string;
  description: string;
}

export class SsmParameterStep extends CliInfoStep {
  constructor(cmd: InfoCommand, private readonly props: SsmParameterStepProps) {
    super(cmd);
  }

  async info(): Promise<Record<string, string>> {
    try {
      const ssmResult = await this.ssmClient.getParameter({
        Name: this.props.parameterName,
        WithDecryption: true,
      });
      return {
        [this.props.description]: ssmResult.Parameter?.Value || '',
      };
    } catch {
      return {
        [this.props.description]: chalk.red(`Error trying to get SSM Parameter [${this.props.parameterName}]`),
      };
    }
  }

  private get ssmClient() {
    const profile = process.env.AWS_PROFILE;
    const region = process.env.AWS_REGION;
    return new SSM({
      region,
      credentials: defaultProvider({ profile }),
    });
  }
}
