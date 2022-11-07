# Installation

## Prerequisites

- none

## Installation Steps

1. Register the component in the workspace

   ```json
   // $PROJECT_HOME/pnpm-workspace.xml
   packages:
     - components/core-cicd/**
   ```

2. Add the package reference to your configuration package

   ```json
   // $PROJECT_HOME/main/config/package.json
   {
     "dependencies": {
       "@aws-ee/core-cicd-infra": "workspace:*"
     }
   }
   ```

3. Add the stage configuration

   ```ts
   // $PROJECT_HOME/main/config/lib/stages/mystage.ts
   // ...
   import type { CoreCicdStageConfig } from '@aws-ee/core-cicd-infra';

   type StageConfig = CoreStageConfig &
     // ...
     CoreCicdStageConfig; // <= add this

   const config: StageConfig = {
     // Add the CICD configuration values
     cicdAwsProfile: 'common', // profile that links to the pipeline account (=EE common)
     cicdAwsRegion: 'us-east-1',
     branch: 'main',
     repositoryName: 'my-poc-repo',
   };
   ```

4. Add the package reference to your infra package

   ```json
   // $PROJECT_HOME/main/infra/package.json
   {
     "dependencies": {
       "@aws-ee/core-cicd-infra": "workspace:*"
     }
   }
   ```

5. Wire up the Infra Module

   ```ts
   // $PROJECT_HOME/main/infra/lib/infrastructure.module.ts
   // ...
   import { CoreCicdInfraModule } from '@aws-ee/core-cicd-infra';

   // ...

   @Global()
   @Module({
     imports: [
       // ...
       CoreCicdInfraModule.with({ config }), // <= add this
     ],
     providers,
     exports: providers,
   })
   export class InfrastructureModule {}
   ```

6. Add the package reference to your CLI package

   ```json
   // $PROJECT_HOME/main/cli/package.json
   {
     "dependencies": {
       "@aws-ee/core-cicd-infra": "workspace:*"
     }
   }
   ```

7. Wire up the Infra Module

   ```ts
   // $PROJECT_HOME/main/cli/lib/cli.module.ts
   // ...
   import { CoreCicdCliModule } from '@aws-ee/core-cicd-infra';

   // ...

   @Module({})
   export class CliModule {
     static with({ stageConfig }: ModuleProps): DynamicModule {
       const config = { ...stageConfig, ...infraConfig };
       return {
         module: CliModule,
         imports: [
           // ...
           CoreCicdCliModule.with({ config }), // <= add this
         ],
       };
     }
   }
   ```

8. Re-Deploy the solution.
   At this point, you need to re-deploy the solution. If you are using the CICD component
   for the first time, this will add the correct cross-account trust configurations to
   the CDK bootstrap stack
   ```bash
   cd $PROJECT_HOME/main/cli
   pnpm cli -- deploy
   ```

9. Deploy the CICD stack
   ```bash
   cd $PROJECT_HOME/main/cli
   pnpm cli -- deploy-cicd
   ```
