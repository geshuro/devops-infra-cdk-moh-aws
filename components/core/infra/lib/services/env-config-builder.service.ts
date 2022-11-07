import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';
import { logger } from '@aws-ee/common';
import { ConfigService } from '@nestjs/config';

import { CoreConfig } from '../config/core-config';
import { StackOutputService } from './stack-output.service';

type CdkOutput = Record<string, Record<string, string>>;

const header = `# GENERATED file please don't edit\n\n`;

/**
 * handleBarsProxy
 *
 * This allows to access configuration classes directly by their unique string
 * which is useful in a handlebars template.
 *
 * Before: `configService.get('core').namespace`
 * After: `core.namespace`
 */
const handlebarsProxy = (configService: ConfigService) =>
  new Proxy(configService, {
    get: (target, prop) => target.get(prop as string),
  });

@Injectable()
export class EnvConfigBuilderService {
  constructor(private readonly configService: ConfigService, private readonly stackOutputService: StackOutputService) {}

  buildConfig(props: { templateFileName: string }): void {
    const coreConfig = this.configService.get<CoreConfig>(CoreConfig.KEY)!;
    const generatedFileName = props.templateFileName.replace('.hbs', '');
    const cdkOutputObject = this.stackOutputService.getCdkOutputObject();

    const cdkOut = this.tryTransformCdkOutput(cdkOutputObject, coreConfig.namespace);

    const template = Handlebars.compile(this.readFile(props.templateFileName));
    const templateData = {
      stacks: cdkOut,
      config: handlebarsProxy(this.configService),
    };
    const generatedEnvConfig = `${header}${template(templateData, {
      allowProtoPropertiesByDefault: true, // this enables the use of the handlebarsProxy
    })}`;

    fs.writeFileSync(generatedFileName, generatedEnvConfig);
  }

  private readFile(name: string) {
    return fs.readFileSync(name).toString();
  }

  private tryTransformCdkOutput(cdkOutputObject: CdkOutput, namespace: string): CdkOutput | undefined {
    try {
      return Object.keys(cdkOutputObject).reduce((prev, key) => {
        const newKey = key.replace(`${namespace}-`, '');
        return { ...prev, [newKey]: cdkOutputObject[key] };
      }, {});
    } catch {
      logger.warn('Failed to parse cdk-out file.');
    }
    return undefined;
  }
}
