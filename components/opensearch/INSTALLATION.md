# OpenSearch Installation

## Prerequisites

- none

> The OpenSearch domain will be installed into the main VPC if the VPC component is detected, otherwise it will expose an internet endpoint.

## Installation Steps

1. Register the component in the workspace

   ```json
   // $PROJECT_HOME/pnpm-workspace.xml
   packages:
     - components/opensearch/**
   ```

2. Add the package reference to your configuration package

   ```json
   // $PROJECT_HOME/main/config/package.json
   {
     "dependencies": {
       "@aws-ee/opensearch-api-infra": "workspace:*"
     }
   }
   ```

3. Add the stage configuration

   ```ts
   // $PROJECT_HOME/main/config/lib/stages/mystage.ts
   // ...
   import { OpenSearchApiStageConfig, OpenSearchMode } from '@aws-ee/opensearch-api-infra';

   type StageConfig = CoreStageConfig &
     // ...
     OpenSearchApiStageConfig; // <= add this

   const config: StageConfig = {
     // ...
     // OpenSearch
     openSearchMode: OpenSearchMode.Create,
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
         sid: 'openSearchAccess',
         actions: ['es:*'],
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
       "@aws-ee/opensearch-api-infra": "workspace:*"
     }
   }
   ```

6. Wire up the Infra Module

   ```ts
   // $PROJECT_HOME/main/infra/lib/infrastructure.module.ts
   // ...
   import { OpenSearchInfraModule } from '@aws-ee/opensearch-api-infra';

   // ...

   @Global()
   @Module({
     imports: [
       // ...
       OpenSearchInfraModule.with(configAndAssets), // <= add this
     ],
     providers,
     exports: providers,
   })
   export class InfrastructureModule {}
   ```

7. Add the post deployment module

   - Add a reference to `@aws-ee/opensearch-api` in the package.json.
   - Wire up the module

   ```ts
   // $PROJECT_HOME/main/backend/post-deployment/src/post-deployment-handler.module.ts
   // ...
   import { OpenSearchPostDeploymentModule } from '@aws-ee/opensearch-api';

   @Global()
   @Module({
     imports: [
       // ...
       CorePostDeploymentModule.withExtensions({
         // add steps
         steps: [CoreRestApiPostDeploymentModule.steps, OpenSearchPostDeploymentModule.steps],
         userManagement: [CognitoUserManagementService],
       }),
       // ...
       OpenSearchPostDeploymentModule, // <= add this
     ],
     exports: [BackendCommonModule],
   })
   export class PostDeploymentHandlerModule {}
   ```

8. Write an index provider

   - The index provider needs to implement `OpenSearchDomainIndexProvider` and it needs to be
     provided in global scope. Here is an example implementation:

   ```ts
   import { Injectable } from '@nestjs/common';
   import { OpenSearchDomain, OpenSearchDomainIndexProvider } from '@aws-ee/opensearch-api';

   @Injectable()
   export class OpenSearchDomainIndexProviderService implements OpenSearchDomainIndexProvider {
     async getDomainNames(): Promise<string[]> {
       return ['studies'];
     }

     async getDomain(domain: string): Promise<OpenSearchDomain> {
       if (domain !== 'studies') {
         throw new Error(`Unknown OpenSearch domain [${domain}]`);
       }

       return {
         domain: 'studies',
         indexes: {
           study: {
             // Everything under mappings is the Opensearch definition
             // of the index and is sent as is to Opensearch.
             mappings: {
               study: {
                 properties: {
                   id: { type: 'keyword' },
                   name: { type: 'text' },
                   description: { type: 'text' },
                   file: {
                     type: 'nested',
                     properties: {
                       name: { type: 'keyword' },
                     },
                   },
                 },
               },
             },
             // Everything under advancedSearchFields defines the searchable
             // fields for the Advanced Search UI. The ID of the field is a
             // unique ID that is composed of the concatenation of the
             // index name and the nested path of the field. The components
             // in the concatenation are separated by the '|' character.
             // '.' is not used as a separator, because MobX does not like
             // '.' in field names. The label of the field is the name of the
             // field that appears in the Advanced Search UI.
             advancedSearchFields: [
               { id: 'study|id', label: 'Dataset ID' },
               { id: 'study|name', label: 'Dataset Name' },
               { id: 'study|description', label: 'Dataset Description' },
               { id: 'study|file|name', label: 'Dataset File Name' },
             ],
             // The domain ID path is the path to the ID of the document in
             // an instance of an object described by the document mapping.
             // The path format is the same as path format used by the lodash _.get
             // method. The domain ID path is used to extract the document IDs from
             // the search results of the indexes.
             domainIdPath: 'id',
           },
         },
       };
     }
   }
   ```

9. Use the modules as needed

   - The package exposes the following modules:
     - `OpenSearchPostDeploymentModule` - used for creating indexes, used in the PostDeployment step.
     - `OpenSearchDocumentModule` - exposes CRUD functionality for documents. You would typically use this in a streaming lambda.
     - `OpenSearchSearchModule` - allows to search on indexes.
   - For example you can write an endpoint exposing the search functionality like this:

   ```ts
   import { Controller, Post, Body, Get, Query } from '@nestjs/common';
   import { OpenSearchSearchService } from '@aws-ee/opensearch-api';

   @Controller('/api/search')
   export class OpenSearchController {
     constructor(private readonly searchService: OpenSearchSearchService) {}

     @Post('basic')
     basic(@Body() body: any) {
       return this.searchService.basicSearch(body);
     }

     @Post('advanced')
     advanced(@Body() body: any) {
       return this.searchService.advancedSearch(body);
     }

     @Get('advanced-fields')
     advancedFields(@Query('domain') domain: string) {
       return this.searchService.listAdvancedSearchFields(domain);
     }
   }
   ```

   - This is just a basic example without validation or authorization, it needs to be adjusted to your needs!

# UI Installation

## Prerequisites

- The UI expects an endpoint exactly as described above.

## Installation Steps

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add a package reference to UI:

- Modify `$PROJECT_HOME/main/ui/package.json`:

- Add to `dependencies`:

  ```json
  "@aws-ee/opensearch-ui": "workspace:*",
  ```

- Modify `$PROJECT_HOME/main/ui/src/plugins/app-context-items-plugin.ts`:

  - Add to imports:

    ```javascript
    import {
      BasicSearchStore as basicSearchStoreMap,
      AdvancedSearchStore as advancedSearchStoreMap,
    } from '@aws-ee/opensearch-ui';
    ```

  - Add to `registerAppContextItems`:

    ```javascript
    basicSearchStoreMap.registerContextItems(appContext, '<YOUR_SEARCH_DOMAIN>');
    advancedSearchStoreMap.registerContextItems(appContext, '<YOUR_SEARCH_DOMAIN>');
    ```

2. Install dependencies

   ```bash
   pnpm install
   ```

# Notes

In a dev environment (`envType: EnvType.Dev`) the OpenSearch component can be used without a VPC.
In all other environments, a VPC is required. The easiest way to run in a VPC is to include the VPC component and configure it to create a VPC. The OpenSearch component will then automatically detect that VPC and install itself into it.