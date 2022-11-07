import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FrameworkVersions } from '@aws-ee/common';
import { Stack, Construct, Stage } from '@aws-cdk/core';
import { CoreApp, CoreStage } from '@aws-ee/core-infra';
import { Repository } from '@aws-cdk/aws-codecommit';
import { Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import { CoreCicdConfig } from '../config/cicd-config';

@Injectable()
export class CicdStack implements OnModuleInit {
  stack?: Stack;

  constructor(
    @Inject(CoreApp) private readonly app: Construct,
    @Inject(CoreStage) private readonly stage: Stage,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const config = this.configService.get<CoreCicdConfig>(CoreCicdConfig.KEY)!;
    this.stack = new Stack(this.app, `${config.namespace}-cicd`);

    const repository = Repository.fromRepositoryName(this.stack, 'Repository', config.repositoryName);

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const pipeline = new CdkPipeline(this.stack, 'Pipeline', {
      cloudAssemblyArtifact,
      cdkCliVersion: FrameworkVersions.CDK,
      sourceAction: new CodeCommitSourceAction({
        actionName: 'Source',
        output: sourceArtifact,
        branch: config.branch,
        repository,
        // Fetch git source instead of ZIP file so we can fetch git submodules
        codeBuildCloneOutput: true,
      }),
      synthAction: new SimpleSynthAction({
        subdirectory: 'main/infra',
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommands: [
          // We should enable git-credential-helper in buildspec but there's no simple way to modify the project's build spec
          "git config --global credential.helper '!aws codecommit credential-helper $@'",
          'git config --global credential.UseHttpPath true',
          // Fetch submodules
          'git submodule init',
          'git submodule update',
          // Install build dependencies
          `npm install -g aws-cdk@${FrameworkVersions.CDK} pnpm@${FrameworkVersions.PNPM}`,
        ],
        buildCommands: ['pnpm recursive install', 'pnpm recursive run build'],
        synthCommand: 'pnpx cdk synth',
        rolePolicyStatements: [
          // Allow the synth action to pull git submodules
          new PolicyStatement({
            actions: ['codecommit:GitPull'],
            resources: [
              this.stack.formatArn({
                service: 'codecommit',
                resource: 'ee-*',
              }),
            ],
          }),
          // Allow the synth action to get and set parameters
          new PolicyStatement({
            actions: ['ssm:GetParameter', 'ssm:PutParameter'],
            resources: [
              this.stack.formatArn({
                service: 'ssm',
                resource: 'parameter',
                resourceName: `${config.paramStoreRoot}/*`,
              }),
            ],
          }),
        ],
        environmentVariables: {
          // Make CICD deploy the same stage as the CICD pipeline's stage
          STAGE: { value: config.envName },
        },
      }),
    });

    pipeline.addApplicationStage(this.stage);
  }
}
