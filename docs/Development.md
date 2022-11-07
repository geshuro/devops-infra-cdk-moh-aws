# Development guide

- [1. Prerequisites](#1-prerequisites)
- [2. Running the UI Locally](#2-running-the-ui-locally)
  - [2.1. Pointing the local UI to the local API](#21-pointing-the-local-ui-to-the-local-api)
- [3. Debugging the API](#3-debugging-the-api)
  - [3.1. Run the API locally](#31-run-the-api-locally)
  - [3.2. Attaching a debugger](#32-attaching-a-debugger)
  - [3.3. OpenAPI](#33-openapi)
- [4. Running Lambdas locally](#4-running-lambdas-locally)
- [5. Debugging the CLI](#5-debugging-the-cli)
- [6. Hotswap](#6-hotswap)
- [7. Generally helpful commands](#7-generally-helpful-commands)
- [8. NestJS](#8-nestjs)
- [9. Infrastructure Checking](#9-infrastructure-checking)
- [10. Architecture Diagrams](#10-architecture-diagrams)

## 1. Prerequisites

- The solution must have all packages installed and built.
- There has to have been a successful deployment.
- This will only work when the stage has been configured as a `Dev` stage (`envType: EnvType.Dev` in stage config file)

## 2. Running the UI Locally

First, make a copy of the UI config file

```bash
cd $PROJECT_HOME/main/ui
cp .env.production .env.local
```

Edit `.env.local` to configure the UI to run locally

```
REACT_APP_LOCAL_DEV=true
REACT_APP_WEBSITE_URL=http://localhost:3000
# Leave everything else unchanged
```

Run the UI locally

```bash
cd $PROJECT_HOME/main/ui
pnpm start
```

The local UI server should now start up and you can access the local UI at `http://localhost:3000`

### 2.1. Pointing the local UI to the local API

If you are running the API locally (see below for instructions), you can point the UI to the local API by updating the following key in the `.env.local` file:
```
REACT_APP_API_URL=http://localhost:4000/myStage
```

`myStage` would be the name of your current stage, typically your user name.


## 3. Debugging the API

### 3.1. Run the API locally

To run the API locally you must first create a local run configuration. To do this, create a new file under `main/backend/api/.env.local` and fill it with the following settings:
```
AWS_REGION=<aws region>
AWS_PROFILE=<aws profile>
AWS_LAMBDA_NAME=<name of the deployed lambda>
```

For example:

```
AWS_REGION=eu-west-2
AWS_PROFILE=sstx
AWS_LAMBDA_NAME=thglaser-ldn-sstx-apiHandler
```

Now you can start the API like this:
```bash
cd main/backend/api
pnpm start # for non-watch mode, OR
pnpm start:watch # for watch mode
```

The API can now be reached under `http://localhost:4000/myStage`.

`myStage` would be the name of your current stage, typically your user name.

### 3.2. Attaching a debugger

Once the API runs locally, a debugger can be attached. Please reference the documentation of the IDE of your choice to find out how to do that.

### 3.3. OpenAPI

The OpenAPI documentation for every endpoint can be reached at `http://localhost:4000/api` once the API is running locally. To customize this within the API [local.ts](../main/backend/api/src/local.ts) see NestJS [documentation](https://docs.nestjs.com/openapi/introduction)

## 4. Running Lambdas locally

The only other Lambda that is included by default is the Post Deployment Lambda. It can be run locally in exactly the same way as the API (see above).

## 5. Debugging the CLI

There are two ways to help with CLI debugging:

Use `cli-debug` instead of `cli`, for example:

```bash
cd $PROJECT_HOME/main/cli
pnpm cli-debug -- info
```

This performs a full TypeScript compilation. The cost is that the CLI is significantly slower to start up.

Use the `--verbose` switch, for example:

```bash
cd $PROJECT_HOME/main/cli
pnpm cli -- info --verbose
```

This creates additional console output that is helpful in finding CLI runtime problems.

For maximum effect it is recommended to use both methods at once when working on the CLI.

## 6. Hotswap

By default, deployments in a Dev environment (`envType: EnvType.Dev`) are deployed using [CDK hotswap](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/README.md#hotswap-deployments-for-faster-development) for faster deployments. This technology is still ⚠ EXPERIMENTAL ⚠. If any issues are encountered in the deployment, hotswap can be disabled by setting
```
SSTX_CDK_HOTSWAP=off
```

in the local system environment.

## 7. Generally helpful commands

```bash
cd $PROJECT_HOME
pnpm build -r # Performs an in-package build for components that need it
pnpm bundle -r # Bundles all deployment packages (Lambdas, UI, ...)
pnpm compile -r # Performs a TypeScript validation on all packages
pnpm compile:watch -r --parallel # TypeScript validation and watch
pnpm lint -r # Perform linting and formatting checks
pnpm format -r # Auto-corrects linting and formatting errors
```

Note: The CLI always performs a build and bundle before deployment, so these steps usually don't need to be run manually.

## 8. NestJS

[NestJS](./NestJS.md) is a dependency injection framework used by the SSTx API handler

## 9. Infrastructure Checking

[Infrastructure is validated](./Infrastructure-Checking.md) by rules that check conditions and apply changes

## 10. Architecture Diagrams

[Architecture diagrams](./ArchitectureDiagrams.md) can be automatically generated from CDK code within the application
