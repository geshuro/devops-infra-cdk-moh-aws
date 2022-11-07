# EventBridge Installation

## Prerequisites

- none

## Installation Steps

1. Register the component in the workspace

   ```json
   // $PROJECT_HOME/pnpm-workspace.xml
   packages:
     - components/eventbridge/**
   ```

2. Give permissions to CloudFormation

   ```ts
   // $PROJECT_HOME/main/config/lib/cf-exec-policies/dev.ts

   // ...
   export const cloudFormationExecPolicyForDevelopment = new PolicyDocument({
     statements: [
       // ...
       new PolicyStatement({
         actions: ['events:*'],
         resources: ['*'],
       }),
     ],
   });
   ```

3. Add the package reference to your infra package

   ```json
   // $PROJECT_HOME/main/infra/package.json
   {
     "dependencies": {
       "@aws-ee/eventbridge-infra": "workspace:*"
     }
   }
   ```

4. Wire up the Infra Module

   ```ts
   // $PROJECT_HOME/main/infra/lib/infrastructure.module.ts
   // ...
   import { EventbridgeInfraModule } from '@aws-ee/eventbridge-infra';

   // ...

   @Global()
   @Module({
     imports: [
       // ...
       EventbridgeInfraModule, // <= add this
     ],
     providers,
     exports: providers,
   })
   export class InfrastructureModule {}
   ```
