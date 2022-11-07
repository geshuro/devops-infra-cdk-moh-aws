import * as fs from 'fs';
import * as path from 'path';
import { Stack } from '@aws-cdk/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreInfraConfig } from '../config/core-infra-config';

export type CdkOutput = Record<string, Record<string, string>>;

interface StackOutputGetBaseProps {
  outputName: string;
  defaultValue: string;
}

interface StackOutputGetNameProps extends StackOutputGetBaseProps {
  stackName: string;
}

interface StackOutputGetObjectProps extends StackOutputGetBaseProps {
  stack: Stack;
}

type StackOutputGetProps = StackOutputGetNameProps | StackOutputGetObjectProps;

/**
 * This service gets stack output values from a previous deployment.
 * CDK saves those values in a JSON file called cdk-out.json
 *
 * Normally you would reference infrastructure in CDK directly but this can create
 * circular references which are hard to resolve.
 *
 * This service works around that by taking values from a previous deployment.
 * The framework will automatically deploy again if a deployment has changed any
 * of the previous output values.
 */
@Injectable()
export class StackOutputService {
  private cdkOutput!: CdkOutput;
  private readonly cdkOutFileName: string;

  constructor(configService: ConfigService) {
    const infraDir = configService.get<CoreInfraConfig>(CoreInfraConfig.KEY)!.infraDir;
    this.cdkOutFileName = path.join(infraDir, 'cdk-out.json');
    this.load();
  }

  get(props: StackOutputGetNameProps): string;
  get(props: StackOutputGetObjectProps): string;

  get(props: StackOutputGetProps): string {
    let stackName: string;
    if ('stack' in props) {
      stackName = props.stack.stackName;
    } else {
      stackName = props.stackName;
    }
    return this.cdkOutput[stackName]?.[props.outputName] || props.defaultValue;
  }

  getSnapshot(): string {
    this.load();
    return JSON.stringify(this.cdkOutput);
  }

  getCdkOutputObject(): CdkOutput {
    return this.cdkOutput;
  }

  private load() {
    try {
      this.cdkOutput = JSON.parse(fs.readFileSync(this.cdkOutFileName).toString());
    } catch {
      this.cdkOutput = {};
    }
  }
}
