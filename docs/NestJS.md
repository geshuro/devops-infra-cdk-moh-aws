# NestJS

## Application Structure

### Files

```bash
main.ts
|
|---<module>.ts       // Imports controllers, providers etc
|---<controllers>.ts  // Configures API endpoints
|---<providers>.ts    // Services, repositories etc
```

### Root

The root of an application is created using a Module via `NestFactory.create`, and then configured to listen on a port. For example `main.ts` :

  ```ts
    import { NestFactory } from '@nestjs/core';
    import { FooModule } from './foo.module';
    const app = await NestFactory.create(FooModule);
    await app.listen(3000);
  ```

Using `createApplicationContext` in place of `create` omits HTTP features

### Nest IoC (Inversion of Control) container

* Constructs an instance of every controller
* Creates an instance of the every controller constructor parameter, unless this has already been created in which case this is fetched

## Decorators

* [TypeScript decorators](./TypeScriptDecorators.md) are used extensively, eg
  * telling NestJS what the function is used for
  * adding parameters
* For example `@Controller('/foo/bar')`
  * Tells NestJS that the function it appears above is a controller
  * Sets the `path` parameter for the controller to be `/foo/bar`

## Modules

### Overview

* Decorated with `@Module()`
* Defines items such as
  * controllers, handling API requests
  * providers, listing classes passed as arguments to controller constructors
  * exports, making their imports available for other modules that import them
* For example `FooModule` below
  * uses controller `FooController`
  * uses service `FooService`
  * exports service `FooService`, so any module importing `FooModule` can access `FooService` without having to import it

```ts
import { Module } from '@nestjs/common';
import { FooController, FooService } from './foo.controller';

@Module({
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService]
})
export class FooModule {}
```

### Global

Global modules are

* available to all other modules without requiring explicit import
* denoted using the `@Global` decorator

For example the `@Global` makes `FooModule` and `FooService` available to all modules without requiring explicit import

```ts
import { Module } from '@nestjs/common';
import { FooController, FooService } from './foo.controller';

@Global
@Module({
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService]
})
export class FooModule {}
```

### Static modules

Defined in the @Module decorator. For example `FooAppModule` below uses the decorator `@Module({ controllers: [FooController], providers: [FooService] })` for static module access:

```ts
import { Controller, Get, Injectable, Module } from '@nestjs/common';

@Injectable()
export class FooService {
  message: string;
  constructor() {
    this.message = 'Foo message';
    console.log(
      `2. FooController constructor instantiates FooService with message ${this.message}`,
    );
  }
}

@Controller()
export class FooController {
  constructor(private readonly fooService: FooService) {
    console.log('3. FooController constructor');
  }
  @Get()
  getBar() {
    console.log(`4. FooController returns message ${this.fooService.message}`);
    return this.fooService.message;
  }
}

@Module({
  controllers: [FooController],
  providers: [FooService],
})
export class FooAppModule {
  constructor() {
    console.log('1. FooAppModule constructor');
  }
}
```

Running this locally and accessing `localhost` in the browser:

```bash
npm run start
1. FooAppModule constructor
2. FooController constructor instantiates FooService with message Foo message
3. FooController constructor
4. FooController returns message Foo message
```

### Dynamic modules

* Configured at run time, allowing values to be read from file, database etc
* Contain a method which
  * returns a `DynamicModule`, containing items normally included statically in the `@Module` decorator such as providers
  * Is called from the main application module, with parameter value(s) modifying the returned `DynamicModule`
* The dynamic providers introduced by the dynamic module can then be injected into the constructors of services, so that their operation is also dynamic
* Controllers using these dynamic service will also have their operation dynamically changed

For example, to convert the example static module in the previous section a dynamic module can be added

```ts
@Module({})
export class FooConfigModule {
  static register(message): DynamicModule {
    return {
      module: FooConfigModule,
      providers: [
        {
          provide: 'FOO_MESSAGE',
          useValue: message,
        },
        FooConfigService,
      ],
      exports: [FooConfigService],
    };
  }
}
```

The static `register` method

* is named `forRoot` or `register` by convention
* returns a dynamically generated module that includes a non-class provider named `FOO_MESSAGE`, set to the value of the `message` parameter
* is called from the `@Module` decorator for the app module

```ts
@Module({
  imports: [FooConfigModule.register('Foo message')],
  controllers: [FooController],
  providers: [FooService],
})
export class FooAppModule {}
```

A config service can be added, using `@Injectable` and `@Inject` decorators to set its constructor value to the `FOO_MESSAGE` provider:

```ts
@Injectable()
export class FooConfigService {
  message: string;

  constructor(@Inject('FOO_MESSAGE') message) { this.message = message }
}
```

This config service can then be added to the `FooService` constructor as a parameter

```ts
@Injectable()
export class FooService {
  message: string;
  constructor(fooConfigService: FooConfigService) { this.message = fooConfigService.message }
}
```

The full dynamic module code is

```ts
import {
  Controller,
  DynamicModule,
  Get,
  Inject,
  Injectable,
  Module,
} from '@nestjs/common';

@Injectable()
export class FooConfigService {
  message: string;

  constructor(@Inject('FOO_MESSAGE') message) {
    console.log('3. FooConfigModule providers instantiates FooConfigService');
    this.message = message;
  }
}

@Injectable()
export class FooService {
  message: string;
  constructor(fooConfigService: FooConfigService) {
    this.message = fooConfigService.message;
    console.log(
      `4. FooController constructor instantiates FooService with message ${this.message}`,
    );
  }
}

@Controller()
export class FooController {
  constructor(private readonly fooService: FooService) {
    console.log('5. FooController constructor');
  }
  @Get()
  getBar() {
    console.log(`6. FooController returns message ${this.fooService.message}`);
    return this.fooService.message;
  }
}

@Module({})
export class FooConfigModule {
  // Method is called forRoot or register by convention
  static register(message): DynamicModule {
    console.log(
      `1. FooAppModule @Module decorator imports FooConfigModule.register with message ${message}`,
    );
    return {
      module: FooConfigModule,
      providers: [
        {
          provide: 'FOO_MESSAGE',
          useValue: message,
        },
        FooConfigService,
      ],
      exports: [FooConfigService],
    };
  }
}

@Module({
  imports: [FooConfigModule.register('Foo message')],
  controllers: [FooController],
  providers: [FooService],
})
export class FooAppModule {
  constructor() {
    console.log('2. FooAppModule constructor');
  }
}
```

Running this locally and accessing `localhost` in the browser:

```bash
npm run start
1. FooAppModule @Module decorator imports FooConfigModule.register with message Foo message
2. FooAppModule constructor
3. FooConfigModule providers instantiates FooConfigService
4. FooController constructor instantiates FooService with message Foo message
5. FooController constructor
6. FooController returns message Foo message
```

## Controllers

### Controller Fundamentals

* `@Controller(path)` handles all request to `/path`
* `@Get(subPath)`, `@Post(subPath)` handles all get, posts to `/path/getPath`
* For example

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('foo')
export class FooController {
  @Get('bar')
  someFunction(): string {
    return 'This function responds to GET /foo/bar';
  }
}
```

The get / post functions optionally include the request object / body as a parameter, via `@Req()` / `@Body()` annotations, eg

```ts
import { Body, Controller, Get } from '@nestjs/common';
import { Request } from 'express';

@Controller('foo')
export class FooController {
  @Get('bar')
  someFunction(@Req() request: Request): string {}
  @Post('bar')
  otherFunction(@Body() body: any): string {}
}
```

For paths that change at runtime

* `:pathName` is used as path
* `@Param('pathName')` annotation fetches the path, eg

```ts
  @Post(':bar')
  yetAnotherFunction(@Param('bar') bar: any): string {
      return `the bar value is ${bar}`
  }
```

### Controller Serialization

* NestJS serializes objects returned by controllers using the `class-transformer` function `classToPlain`
* This allows customization such as `@Expose`, allowing an object property to be accessed using a name that differs from the property name, provided [transformation](#transformation) is enabled in the `ValidationPipe`
* For example the following code runs correctly since `@Get` accesses it using a `emailName` with value ('email') which matches the property name of the `User` parameter of its associated method. However if `emailName` is set to anything other than `email` the function fails and returns a 400:

```ts
const emailName = 'email';

class User {
  @IsEmail()
  email: string;
}

@Controller()
export class FooController {
  constructor() {}
  @Get(`:${emailName}`)
  getUser(@Param() user: User): string {
    return JSON.stringify(user.email);
  }
}
```

However, if `@IsEmail()` is preceded by `@Expose({ name: emailName })` then `emailName` can be set to any value and the function will not fail.

## Authorization

[Controller functionality can be restricted](./Authorization.md) according to authorization via approaches such as

* Request context
* Controller decorators

## Validation

### Fundamentals

* Based on [class-validator](./ClassValidator.md), which uses annotations to validate class data
* A global validation pipe can be defined so that all incoming data is validated. Note that this sets to true `transform`, `whitelist`, `forbidNonWhitelisted` and `forbidUnknownValues` to avoid [security issues](https://github.com/typestack/class-validator/issues/1350) such as [SQL injection and XSS](https://github.com/advisories/GHSA-fj58-h2fr-3pp2); within SSTx `defaultValidationPipe` from `@aws-ee/core` can be used for this purpose.

```ts
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }));
```

Then validation is added by

* Defining a class containing the properties being sent to the endpoint
* Adding `class-validator` annotations

For example, here email validation is added, so

* `/foo` returns 400 with message *email must be an email*
* `/foo@bar.com` returns a page containing *foo@bar.com*

```ts
import { Controller, Get, Param, Req } from '@nestjs/common';
import { IsEmail } from 'class-validator';

class User {
  @IsEmail()
  email: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get(':email')
  getUser(@Param() user: User): string {
    return JSON.stringify(user.email);
  }
}
```

### Validation Configuration

#### Transformation

If a `ValidationPipe` is created with argument `{ transform: true }` then all payloads are transformed using their defined type.

In the previous example, when `/foo@bar.com` is accessed the `getUser` function argument value is `{ email: 'a@b.com' }`, but if transformation is enabled in the `ValidationPipe` then the `getUser` function argument value becomes an instance of its type, ie `User { email: 'a@b.com' }`.

#### Allow list

Configures validation so that an exception is thrown if any payload property does not have a `class-validator` annotation

## Providers

### Basics

* Can be a service, repository, factory etc
* To add a provider of class `P` to a controller
  * declare a parameter of type `P` in the constructor
  * add class `P` to the providers list for the module
  * when the controller is instantiated (by Nest when the app starts) an instance of `P` will be passed into the constructor
* For example, FooController has a FooService parameter, which is initialized to a FooService object then used in `getFooBar`:

```ts
@Controller()
export class FooController {
  constructor(private readonly fooService: FooService) {}
  @Get()
  getFooBar() {
    this.fooService.getBar();
  }
}
```

* To make the above code work FooService must be declared as a provider in the module (compilation fails if this is not done):

```ts
import { Module } from '@nestjs/common';
import { FooController, FooService } from './foo.controller';

@Module({
  controllers: [FooController],
  providers: [FooService],
})
export class FooModule {}
```

### Custom Providers

In the above module `providers: [FooService]` is syntactic sugar for

```ts
providers: [{
    provide: FooService,
    useClass: FooService,
}],
```

`useClass` can be replaced with `useValue` to specify a different value for the provider (provided TypeScript's structural typing recognizes it as compatible). For example, given

```ts
export class FooService {
  getBar = (): string => 'Bar!';
}

@Controller()
export class FooController {
  constructor(private readonly fooService: FooService) {}
  @Get()
  getUser() {
    return this.fooService.getBar();
  }
}
```

the following causes `NewBar!` rather than `Bar` to be returned for get requests:

```ts
providers: [{
    provide: FooService,
    useValue: {
      getBar: (): string => 'NewBar!',
    },
}],
```

### Non-Class Providers

* Rather than implicitly having a provider passed to a constructor, it can also be explicitly named
* The previous example can be rewritten using this form as

```ts
export class FooService {
  getBar = (): string => 'Bar!';
}

@Controller()
export class FooController {
  constructor(@Inject('FOO_SERVICE') private readonly fooService: FooService) {}
  @Get()
  getUser() {
    return this.fooService.getBar();
  }
}
```

with providers set to:

```ts
providers: [
  {
    provide: 'FOO_SERVICE',
    useValue: {
      getBar: (): string => 'NewBar!',
    },
  },
],
```

### Injectable

When an item in the `providers` list is decorated with `@Injectable`

* NestJS instantiates it when the app starts
* If its constructor has parameters then
  * Their classes must be included in the providers list
  * They are instantiated and passed to the constructor

For example:

```ts
import { Injectable, Module } from '@nestjs/common';

class A {
  x: string;
  constructor() { this.x = 'hello' }
}

@Injectable()
export class InjectableService {
  constructor(a: A) { console.log(a) }
}

@Module({
  providers: [InjectableService, A]
})
export class FooAppModule {}
```

When the above code is run the output is

```bash
A { x: 'hello' }
```

Transitive dependencies between `Injectable` services are handled automatically. If the above example is modified so that the constructor in A takes a parameter of type B then provided A is decorated as `Injectable` and B is included in the `providers` list then execution will be successful and the output will be the same as above:

```ts
import { Injectable, Module } from '@nestjs/common';

class B {
  y: string;
  constructor() { this.y = 'hello' }
}

@Injectable()
class A {
  x: string;
  constructor(b: B) { this.x = b.y }
}

@Injectable()
export class InjectableService {
  constructor(a: A) { console.log(a) }
}

@Module({
  providers: [InjectableService, A, B]
})
export class FooAppModule {}
```

### Scope

`@Injectable({ scope })` configures a provider to be scoped as

* `Scope.DEFAULT` default: global singleton shared across entire app
* `Scope.REQUEST` per request
* `Scope.TRANSIENT` per consumer

## Configuration

### Configuration from File

Configuration can be read from files by

* Importing `ConfigModule.forRoot({ envFilePath })` within the root app module. This reads a configuration map from the `envFilePath` path.
* Adding a ConfigService parameter to any service requiring this configuration map
* Calling `get(envFileKey)` on the ConfigService parameter to fetch the value corresponding to `envFileKey` key

For example, given `.foo.env` within the project root folder:

```ts
FOO_KEY=bar
```

When the following app starts, the value matching key `FOO_KEY` (ie `bar`) will be output to the console:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class FooModule {
  constructor(configService: ConfigService) { console.log(configService.get<string>('FOO_KEY')) }
}

@Module({
  imports: [ ConfigModule.forRoot({ envFilePath: '.foo.env' }) ],
  providers: [FooModule, ConfigModule],
})
export class FooAppModule {}
```

### Configuration from Function

Modules can use `forFeature` in place of `forRoot`; its parameter is a function returning a configuration map, rather than an object specifying a path from which to read the configuration map. Thus if the above example has `forRoot` changed to `forFeature`, ie its root module is changed from:

```ts
@Module({
  imports: [ ConfigModule.forRoot({ envFilePath: '.foo.env' }) ],
  providers: [FooModule, ConfigModule],
})
export class FooAppModule {}
```

to:

```ts
@Module({
  imports: [ ConfigModule.forFeature(() => { return { FOO_KEY: 'bar' } }), ],
  providers: [FooModule, ConfigModule],
})
export class FooAppModule {}
```

then the same value as before (`bar`) will be written to the console

## Usage in SSTx

### SSTx Root

#### `NestFactory.create`

Configures global `ApiHandlerModule` as a Nest application

#### `NestFactory.createApplicationContext`

Configures

* `PostDeploymentHandlerModule`
* `CliModule`
* `InfrastructureModule` (global)

Can also be configured to add local / global static / dynamic modules supporting functionality such as

* DynamoDB
* Lambdas
* Solution specific operations

### SSTx Modules

#### SSTx Global Modules

* `ApiHandlerModule`
* `InfrastructureModule`
* `BackendCommonModule`

#### SSTx Local Modules

* `LocalDebuggingModule`
* `CliModule`

#### SSTx Dynamic Modules

* `CliModule`

### SSTx Controllers

* `LocalDebuggingController`
* `AppController`

### SSTx Validation

* Global validation pipes ensure all incoming data is validated and are defined in
  * `APIGatewayProxyHandler`
  * SSTx root module
* Settings are configured to
  * Allow list all payload properties, ie throw an exception if any payload property does not have a `class-validator` annotation
  * Transform all payloads

### SSTx Providers

| Provider                | Used by                |
| ----------------------- | ---------------------- |
| `AppService`            | `ApiHandlerModule`     |
| `AuthorizationProvider` | `BackendCommonModule`  |
| `LoggerService`         | `BackendCommonModule`  |
| `CoreApp`               | `InfrastructureModule` |
| `CoreStage`             | `InfrastructureModule` |

### SSTx Injectable Scope

* `Scope.DEFAULT`
  * `AppService`
  * `AuthorizationProviderService`
* No other scopes are used

### SSTx Module Configuration

Modules are configured in SSTx by

* Declaring a config class `C` containing module settings annotated with `class-transformer` and `class-validator` decorators such as `@Expose` and `@IsOptional`
* Setting NodeJS environment variables containing configuration values matching the names declared in the `@Expose` statements
* Calling `ConfigModule.forFeature(configEnvLoader(C))`, which copies configuration data from the NodeJS environment variables to the config class C

For example, given a service `FooService`

```ts
@Injectable()
export class FooService {
  private config: FooConfig;

  constructor(configService: ConfigService) {
    this.config = configService.get<FooConfig>(FooConfig.FOO_CONFIG_KEY)!;
    console.log(this.config.fooVariable);
  }
```

and a config class `FooConfig`

```ts
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class FooConfig {
  static KEY = 'FOO_CONFIG_KEY';

  @IsOptional()
  @Expose({ name: 'FOO_VARIABLE' })
  fooVariable?: string;
}
```

a module can be declared as importing the config and providing the service

```ts
@Global()
@Module({ imports: [ConfigModule.forFeature(configEnvLoader(FooConfig))], providers: [FooService] })
export class FooModule {}
```

Within this module a handler `fooHandler` can be declared to access `fooService`

```ts
export const fooHandler = async (): Promise<void> => {
  const context = await NestFactory.createApplicationContext(FooModule);
  const fooService = context.get(FooService);
  ...
```

A lambda can be declared within the module which uses `fooHandler`

```ts
    const fooLambda = new Function({ environment: { FOO_VARIABLE: 'bar' }, handler: 'index.fooHandler',
...
```

The fooService will be instantiated with the ConfigService injected by NestJS. This will be instantiated using the environment variable used to construct the lambda, and so `console.log(this.config.fooVariable);` within the service will output the value from this environment variable ('bar').

## Usage in MOH Spain

### MOH Spain Screening Input

`ScreeningInputConfig` is declared as containing optional / non-optional `rawMetadataBucket` / `processedMetadataBucket` with capitalized aliases:

```ts
export class ScreeningInputConfig {
  static KEY = 'screeningInputConfig';

  @IsOptional()
  @Expose({ name: 'RAW_METADATA_BUCKET' })
  rawMetadataBucket?: string;

  @IsString()
  @Expose({ name: 'PROCESSED_METADATA_BUCKET' })
  processedMetadataBucket!: string;
}
```

Screening input module (`ScreeningInputModule`) includes

* `ScreeningInputConfig` as an import, initialized using `ConfigModule.forFeature(configEnvLoader(ScreeningInputConfig))`, which generates an instance of `ScreeningInputConfig` using environment variables `RAW_METADATA_BUCKET` and `PROCESSED_METADATA_BUCKET`
* `ScreeningInputService` as a provider, which
  * Is `Injectable`
  * Has a constructor which takes as parameters
    * Items defined globally in `backend-common.module.ts`
      * LoggerService
      * ArticleDbService
      * StatusPusherService
    * `ConfigService`

```ts
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(configEnvLoader(ScreeningInputConfig)),
    BackendCommonModule
  ],
  providers,
  exports: [...providers],
})
export class ScreeningInputModule {}
```

The `ScreeningInputService` constructor fetches an instance of `ScreeningInputConfig`, using `ScreeningInputConfig.Key`:

```ts
  constructor(
    log: LoggerService,
    articleDbService: ArticleDbService,
    statusPusherService: StatusPusherService,
    configService: ConfigService
  ) {
    this.s3Client = new S3({});
    this.articleDbService = articleDbService;
    this.statusPusherService = statusPusherService;
    this.log = log;
    this.config = configService.get<ScreeningInputConfig>(ScreeningInputConfig.KEY)!;
  }
```

The config is then used in `ScreeningInputService` to access S3 buckets, for example

```ts
async downloadRawMetadataS3(props: { objectKey: string }): Promise<string> {
    return this.s3Get({
      bucket: this.config.rawMetadataBucket!,
      objectKey: props.objectKey,
    });
  }
```

This configuration is used within `DocumentInput`, which defines `DocumentInputProps`

```ts
interface DocumentInputProps {
  namespace: string;
  dbPrefix: string;
  removalPolicy: RemovalPolicy;
  loggingBucket: Bucket;
  articleTable: Table;
  screeningsTable: Table;
  websiteUrl: string;
}
```

and uses `DocumentInputProps` as a parameter within its constructor, which initializes a `rawMetadataBucket`, which in turn is used to initialize the environment variables within a lambda:

```ts
export class DocumentInput {
  public readonly rawMetadataBucket: Bucket;
  public readonly processedMetadata: Bucket;
  constructor(readonly scope: Construct, props: DocumentInputProps) {
    this.rawMetadataBucket = new Bucket(
      bucketName: `${props.namespace}-raw-metadata`,
  ...

    const processLambda = new Function(
      scope,
      `ProcessMetadata${props.namespace}`,
      {
        handler: 'index.processMetadataHandler',
        environment: {
          RAW_METADATA_BUCKET: this.rawMetadataBucket.bucketName!,
          PROCESSED_METADATA_BUCKET: this.processedMetadata.bucketName!,
          APP_DB_PREFIX: props.dbPrefix,
        },
...
```

The lambda handler is `processMetadataHandler`, and this uses `NestFactory.createApplicationContext(ScreeningInputModule)` to create a `ScreeningInputModule`, from which a `ScreeningInputService` is created and in turn the `downloadRawMetadataS3` function called:

```ts
async function bootstrap(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(ScreeningInputModule);
}
const contextPromise = bootstrap();

export const processMetadataHandler = async (event: S3Event) => {
  const context = await contextPromise;
  const inputService = context.get(ScreeningInputService);
  const metadataCSVString = await inputService.downloadRawMetadataS3({
    objectKey: s3Info.object.key,
  });
...
```

`DocumentInput` is initialized within the `ScreeningStack` constructor

```ts
@Injectable()
export class ScreeningStack extends Stack {
  constructor(
    configService: ConfigService,
    coreStack: CoreStack,
    @Inject(CoreStage) stage: Construct,
    apiStack: ApiStack,
    postDeploymentStack: PostDeploymentStack,
    openSearchStack: OpenSearchStack,
    stackOutputService: StackOutputService,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const input = new DocumentInput(this, {
      namespace: coreConfig.globalNamespace,
...
```

This is injected with values including the globally defined `CoreConfig`

Summarizing the above

* `downloadRawMetadataS3` accesses `this.config.rawMetadataBucket`
* `this.config` is initialized using `this.config = configService.get<ScreeningInputConfig>(ScreeningInputConfig.KEY)!;`
* `ConfigService` is initialized by NestJS within `ScreeningInputModule`: `imports: [ ConfigModule.forFeature(configEnvLoader(ScreeningInputConfig))`
* The initialization of `ConfigService` takes its values from environment variables 'RAW_METADATA_BUCKET' and 'PROCESSED_METADATA_BUCKET'
* The environment variables are initialized when the processing lambda `processLambda` is initialized, using `rawMetadataBucket` and `processedMetadataBucket` properties
* The `rawMetadataBucket` and `processedMetadataBucket` properties are initialized using values from `DocumentInputProps`
* `DocumentInputProps` is initialized from `ScreeningStack`, which has values injected from `CoreConfig`
* `CoreConfig` is defined globally
