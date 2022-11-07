### Repo setup

Isengard -> CodeCommit -> Create Repository
Clone HTTPS
`git clone <url> --recurse-submodules` --> empty repo!

`git remote add sstx <sstx-helloworld>`
`git pull sstx`
`git checkout -b main`
`git merge sstx/main`
`ls` to confirm
`code .`
`git submodule update --init --recursive`
`git push origin`

Optional: squash commits

### Deploy

`pnpm initial-setup`

Copy-paste stage config example.ts to <username>.ts
To remove the config from .gitignore comment out `# lib/stages/**`

CloudFormationExecPolicy default policy has all permissions to deploy all resources for SSTx, this might be different for a production customer's account if certain resources need to be restricted.

AdminPrincipals: email needs to be real as on stage creation an email with temporary credentials will be sent out.

UI hosting:

- public -> CF
- regional -> API Gateway at CF edge locations
- private -> API Gateway in a VPC which needs more config as tunneling needs to be setup

`cd main/cli`
`pnpm cli` to see what commands are available
`pnpm cli -- deploy` to deploy the solution

Note: NoSuchEntity policy not found is not critical.

2 Toolkit stacks: chosen region & us-east-1 for public hosting and Lambda@Edge and WAF

WAF: need to add your IP at both!
by default in regional mode only 1 WAF
HINT: in Web ACL tab there are IPs from which access was attempted

UI knows backend URL by having .env.production file generated.

Usage of `pnpm cli -- deploy --verbose` is useful to see more granular reasons of failed deployments

### SSTx highlights

main/infra for infrastructure
infrastructure.module.ts
`@Module imports` is where all components are combined. Each module is a separate stack, although it's not a requirement.
Historically backend was split into RestApi and Auth, the edge case was to access Auth table and write something to RestApi stack, which would created a circular dependency.

For a new project it makes sense to create a new stack.

Let's create a DynamoDB table.
infra/lib/my-stack.ts

`import { Stack } from '@aws-ee/core-infra'`
EE specific Stack must be used instead. There's an Aspect rule that makes sure Stack isn't imported from @aws-cdk.

====

Detour

#### Aspects

Aspect: core/infra/lib/infra/aspects/s3-rules.ts `checkBucketEncryption`
Process every node of components to be deployed and add rules.

Use this to enforce/suggest good practices.

====

```typescript
// follow example of ui.stack.ts

import { CoreStage, Stack } from '@aws-ee/core-infra';
import { Injectable, Inject } from '@nestjs/common';
import { Construct } from '@aws-cdk/core';

@Injectable() // needed for dependency injection to work
export class MyStack extends Stack {
  constructor(@Inject(CoreStage) stage: Construct) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'my-stack', {
      description: 'Contains things',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
  }
}
```

====

To add a package

Manually edit package.json and pick a version already used in codebase (!). This is important because latests version of individual packages might be incompatible with the rest.

====

Now tell the dependency injection framework that our new stack exists. THis is achieved by adding the class to `const providers = [..., MyStack]` in infrastructure.module.ts

Read more at NestJS docs.

===

After deployment accessing the URL will result in 403 error due to WAF restrictions.
Read more about how to add your IP to an allow-list at docs/Web-Application-Firewall.md.

===

Check the temporary password from email to Login.

===

_-_-\*-toolkit is the stack CDK deploys
-auth is for Auth tables like Users and RevokeTokens
-core has useful things like a KMS key for encryption and logs
-api hosts API Gateway and Lambdas: apiHandler & authenticationHandler (although it might be confused with being in auth stack)
-ui has bundled UI JS files
-postDeployment has a Lambda with the code to execute after deployment is complete
All stacks might have some CDK specific resources.

In Dev environment all resources of the deployment will be deleted. In Demo/Prod resources are retained, which complicates re-creations.

===

After re-deployment newly created stack is added and has some CDK resources.

### Dev flow

=======================

SESSION 2

=======================

created a stack and can create resources there.

Nest: Module, Provider (services), Imports

Module is the highest building block.
At the very root there's `createApplicationContext(ModuleX)`
Module can be constructed of many other modules.
Modules consists of providers (99% of the cases a class)

- why called a provider? class is a function in JS, provider because a function is called and provides an instance of a class
  All classes are singletons.

Nest is a dependency injection framework (among other things).
Instances are created on demand and are signletons.
Make a non-singleton @Injectable({ scope: Scope.SINGLETON | REQUEST | TRANSIENT })
Transient - a new instance is made for every injection.

Context:

[MAX NOTE: in Java's Spring one declares scope and all annotated components are scanned. In Nest one has to actively add them to a module.]

UserService.ts
All dependencies are passed to a constructor.

Normally Nest will throw if a dependency isn't available (can't be created or isn't part of a module). Can make a dep optional with @Optional

Can inject interfaces, with a way to implement them.

=====

Backend

NestJS dependency injection part is used in Infra, Backend, PostDeployment, CLI
But it also provides tools for building a server with express.

Controller is a class with methods + annotations:
@Controller, @Get, @Post. Controller is automatically hooked to endpoints.

With small adjustments we can also get OpenAPI docs.

Validating controller params (input to POST/PUT for example)
`class-validator` example in update-user.model.ts

PickType to keep things DRY and to extend original model.

==

DynaMoose

UserSchemaModelDefinition (not the same as User object, although partially replicated)
Please specify any indices used in a table, so Dynamoose can be efficient about querying

`.forRoot` to init with params
`.forFeature` to register schemas

Usage:
`constructor(@InjectModel(SchemaX.name) model: Model<X, XKey>)`
than `model` gets all the commands like `scan`/`query`


======================

AuthZ CASL

authorization-provider.service.ts

- declaring abilities. core-abilities.ts
- checking abilities. 
  1. Controller level - `@UseGuards(AbilityGuard)`
  2. Method level -  `@AssertAbilities(can(Action.Read, User))`
  3. `throwUnlessCan` vs `@AssertAbilities`. `throwUnlessCan` when need to validate against specific data/fields.




