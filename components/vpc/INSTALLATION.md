# Installation

## Prerequisites

- none

## Installation Steps

1. Register the component in the workspace

   ```json
   // $PROJECT_HOME/pnpm-workspace.xml
   packages:
     - components/vpc/**
   ```

2. Add the package reference to your configuration package

   ```json
   // $PROJECT_HOME/main/config/package.json
   {
     "dependencies": {
       "@aws-ee/vpc-infra": "workspace:*"
     }
   }
   ```

3. Add the stage configuration

   ```ts
   // $PROJECT_HOME/main/config/lib/stages/mystage.ts
   // ...
   import { VpcMode, VpcStageConfig } from '@aws-ee/vpc-infra';

   type StageConfig = CoreStageConfig &
     // ...
     VpcStageConfig; // <= add this

   const config: StageConfig = {
     // VPC
     vpcMode: VpcMode.Create,
   };
   ```

4. Give permissions to CloudFormation

   ```ts
   // $PROJECT_HOME/main/config/lib/cf-exec-policies/dev.ts

   // ...
   export const cloudFormationExecPolicyForDevelopment = new PolicyDocument({
      statements: [
        // ...
        new PolicyStatement({
          actions: ['ec2:*'],
          resources: ['*'],
        }),
      ],
   });
   ```

5. Add the package reference to your infra package

   ```json
   // $PROJECT_HOME/main/infra/package.json
   {
     "dependencies": {
       "@aws-ee/vpc-infra": "workspace:*"
     }
   }
   ```

6. Wire up the Infra Module

   ```ts
   // $PROJECT_HOME/main/infra/lib/infrastructure.module.ts
   // ...
   import { VpcInfraModule } from '@aws-ee/vpc-infra';

   // ...

   @Global()
   @Module({
     imports: [
       // ...
       VpcInfraModule.with(configAndAssets), // <= add this
     ],
     providers,
     exports: providers,
   })
   export class InfrastructureModule {}
   ```