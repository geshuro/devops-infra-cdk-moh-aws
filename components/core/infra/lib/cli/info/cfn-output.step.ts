import chalk from 'chalk';
import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

import { CliInfoStep } from './cli-info.step';
import { InfoCommand } from '../info.command';

interface CfnOutputStepProps {
  stackName: string;
  variableName: string;
  description: string;
}

export class CfnOutputStep extends CliInfoStep {
  constructor(cmd: InfoCommand, private readonly props: CfnOutputStepProps) {
    super(cmd);
  }

  async info(): Promise<Record<string, string>> {
    try {
      const stackInfo = await this.cfnClient.describeStacks({
        StackName: this.props.stackName,
      });
      const output = stackInfo.Stacks![0].Outputs?.find((output: any) => output.OutputKey === this.props.variableName);
      if (output) {
        return {
          [this.props.description]: output.OutputValue!,
        };
      }
      return {};
    } catch {
      return {
        [this.props.description]: chalk.red(`Error trying to get CFN Output from [${this.props.stackName}]`),
      };
    }
  }

  private get cfnClient() {
    const profile = process.env.AWS_PROFILE;
    const region = process.env.AWS_REGION;
    return new CloudFormation({
      region,
      credentials: defaultProvider({ profile }),
    });
  }
}
