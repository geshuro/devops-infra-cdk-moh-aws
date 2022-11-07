# SSTx

- [1. Prerequisites](#1-prerequisites)
- [2. Installation](#2-installation)
- [3. Set CloudFormation Execution Policy](#3-set-cloudformation-execution-policy)
- [4. CLI](#4-cli)
- [5. Deploy](#5-deploy)
- [6. Accessing the application](#6-accessing-the-application)
- [7. Debugging](#7-debugging)
- [8. Authorization](#8-authorization)
- [9. pnpm Workspace](#9-pnpm-workspace)

## 1. Prerequisites

- Base requirements
  - [Node.js v14.x](https://nodejs.org/en/)
  - [pnpm v6.3.0+](https://pnpm.io/)
- IDE
  - [VS Code](https://code.visualstudio.com/) (recommended, any other IDE will work too)

## 2. Installation

Clone the repository including all submodules

```bash
> git clone <repo url> --recurse-submodules
```

If you forgot to clone with the `--recurse-submodules` option, you can initialize git submodules as follows

```bash
> cd $PROJECT_HOME
> git submodule update --init --recursive
```

In project root:

```bash
> pnpm initial-setup
```

Optional but recommended, install `husky` for automated linting before a commit:

```bash
> pnpm install-husky
```

This command installs a git hook that runs a full code lint before each commit. It will abort the commit if the lint run is unsuccessful.

**Note:** While it is strongly recommended to do this, a full linting run takes *in excess of 90 seconds*. If you are in the habit of frequently running `pnpm lint -r` anyway then you don't need to install this.

Configure your deployment settings:

- Have a look at `./main/config/lib/stages/example.ts`
- Copy the example to a file with the same name as your OS user, for example `./main/config/lib/stages/thglaser.ts`
- If your user name contains reserved strings, like `aws`, choose another name for the file. In this case, you will always have to provide the stage name for deployment commands. See the deploy section for more info.
- Adjust the settings in the file to your needs, help is shown when hovering over each field.

## 3. Set CloudFormation Execution Policy

Inspect the CloudFormation Execution Policies under `main/config/lib/cf-exec-policies`. These are used to create managed policies which CloudFormation will assume whenever it deploys or updates a piece of infrastructure. The stage settings define, which policy is being assumed.

Whenever our infrastructure code instructs CloudFormation to create something that is not covered by the policy, an error will be thrown on deployment.

For example, when **AWS Glue** is part of our infrastructure, we need to add a statement like this to the policy:

```ts
// main/config/lib/cf-exec-policies/dev.ts

export const cloudFormationExecPolicyForDevelopment = new PolicyDocument({
  statements: [
    // ...
    new PolicyStatement({
      actions: ['glue:*'],
      resources: ['*'],
    }),
  ],
});
```

> This policy is intended for development only and potentially too permissive. We recommend to create a separate policy for production that is more refined.

## 4. CLI

The project has a built-in CLI which helps running common tasks. To show the CLI help screen:

```bash
> cd main/cli
> pnpm cli
```

## 5. Deploy

In project root:

```bash
> cd main/cli
> pnpm cli -- deploy
```

If you want to deploy to a different stage, use

```bash
> cd main/cli
> pnpm cli -- deploy --stage my-other-stage
```

The last command expects that there is a stage config called `my-other-stage.ts` in `main/config/lib/stages/`


## 6. Accessing the application

To get endpoints and URLs of the deployment, run these commands:

In project root:

```bash
> cd main/cli
> pnpm cli -- info
```

Initially, all IPs are blocked from accessing the application. See the [WAF Guide](./docs/Web-Application-Firewall.md) to learn how to unblock your IP.


## 7. Debugging

See the [development guide](./docs/Development.md).

## 8. Authorization

See the [authorization guide](./docs/Authorization.md).

## 9. pnpm Workspace

Add a package to root pnpm-workspace.yaml for any of its package.json scripts to work.
Packages not listed in the file aren't included in any of `pnpm -r` recursive commands.
