# Extending the user entity

- [1. Which approach should I use?](#1-which-approach-should-i-use)
- [2. How to add a Custom Claim to Cognito](#2-how-to-add-a-custom-claim-to-cognito)
  - [2.1. Declare Custom Claims](#21-declare-custom-claims)
  - [2.2. Update Custom Claims via the API](#22-update-custom-claims-via-the-api)
  - [2.3. Replace API endpoints for type safe fields](#23-replace-api-endpoints-for-type-safe-fields)
  - [2.4. Show Custom Claims in the UI](#24-show-custom-claims-in-the-ui)
- [3. Store additional fields in a custom data store](#3-store-additional-fields-in-a-custom-data-store)
  - [3.1. Define a table](#31-define-a-table)
  - [3.2. Create the Dynamoose Schema](#32-create-the-dynamoose-schema)
  - [3.3. Write a service providing access to the data](#33-write-a-service-providing-access-to-the-data)
  - [3.4. Further steps](#34-further-steps)

A User is stored entirely in the IDP (Cognito by default). If you wish to store additional values against a User, you have two options:
* Add custom claims to a User in Cognito
* Store additional fields in a secondary data store like Dynamo DB

## 1. Which approach should I use?

Cognito is not a high performance data store especially when it comes to writing data. Therefore, the type of data that might be good candiates to be stored as custom claims are:

* eye colour
* social security number

Data that changes a lot and requires frequent writes should be stored in an external data store. Examples of data that should **not** be stored in Cognito:

* Game scores
* Current location (frequently updated)

## 2. How to add a Custom Claim to Cognito

### 2.1. Declare Custom Claims
The first step is to declare the custom claim in the stage config file. Consider the following example:

```ts
// ...
import {
  CoreAuthCognitoStageConfig,
  CognitoCustomAttributeMode,
  CognitoCustomAttributeType,
} from '@aws-ee/core-auth-cognito-infra';

// ...

const config: StageConfig = {
  // ...
  customAttributes: {
    eyeColour: {
      mode: CognitoCustomAttributeMode.READ_WRITE,
      type: CognitoCustomAttributeType.STRING,
    },
    shoeSize: {
      mode: CognitoCustomAttributeMode.READ,
      type: CognitoCustomAttributeType.NUMBER,
    },
    leftHanded: {
      mode: CognitoCustomAttributeMode.ADMIN_ONLY,
      type: CognitoCustomAttributeType.BOOLEAN,
    },
  },
};
```

As you can see above, every attribute must be configured with a `mode` and a `type`.

The `mode` refers to the access permissions of the claim. The following modes are supported:
* `ADMIN_ONLY`: This field can only be seen by an administrative User which is a User that can see the list of Users in the UI.
* `READ`: A non-admin User is allowed to **read** this field but only from their own User object.
* `READ_WRITE`: A non-admin user can **read** and **update** this field on their own User object.

The `type` refers to the data type of the claim. See the `CognitoCustomAttributeType` enum and auto complete options for a list of currently supported types.

### 2.2. Update Custom Claims via the API

The API endpoints support custom claims out of the box. Whenever you perform a read operation on `/api/user` or `/api/users`, you will receive a field called `claims` which contains an object map of the claims saved against that user. If you use the `/api/user` endpoint, the `mode` of the Custom Claim comes into play. If the `mode` is set to `ADMIN_ONLY`, the claim will not be returned in the `claims` map.

> Note: Via the `/api/user` endpoint, even an admin User will not be able to read claims that are `ADMIN_ONLY`!

Performing update operations works in a similar way. You can post an object map in the `claims` field of the JSON data.

> Note: The name of Custom Claims will be prepended with `custom:`. So if your Custom Claim is configured as `eyeColour`, it will be returned as `custom:eyeColour`.

### 2.3. Replace API endpoints for type safe fields

If you would like to have first class root level fields instead of the `claims` map, you can replace the `/api/user` and `/api/users` endpoints with your own implementation. To do this, you must first disable the built-in controllers. The file `main/backend/api/src/api-handler.module.ts` will contain an import from the `CoreRestApiModule` that looks like this:

```ts
CoreRestApiModule.withControllers()
```

Replace this with the following to disable the built-in `/api/user` and `/api/users` endpoints:

```ts
CoreRestApiModule.withControllers({ user: false, users: false })
```

You can now implement your own version of those controllers and install them under `/api/user` and `/api/users`.

### 2.4. Show Custom Claims in the UI
If you would like to show custom values in the UI you will have to replace the built-in User CRUD pages via routing overrides.

To add routing overrides, edit `main/ui/src/routes.ts`
```ts
// ...
import { FaHandSpock } from 'react-icons/fa';
import HelloPage from './parts/hello/HelloPage';
import MyUserProfileDetails from './parts/users/MyUserProfileDetails';
import MyUserProfileEdit from './parts/users/MyUserProfileEdit';

// ...

export const routes: RouteEntry[] = [
  // Routing overrides here
  { path: '/user/view', page: withAuth(MyUserProfileDetails) },
  { path: '/user/edit', page: withAuth(MyUserProfileEdit) },

  ...dashboardRoutes,
  ...authRoutes,

  // Add your own routes here...
  { path: '/hello', page: withAuth(HelloPage) },
];

```

## 3. Store additional fields in a custom data store

If you find that the type of data you need to save is not appropriate for Cognito, you need to create a secondary data store, for example in Dynamo DB.

### 3.1. Define a table

To create a table, you must first create a stack if you've not done so yet.

The table should have the `username` as the hash key, for example like this:
```ts
const gameScores = new DynamoDB.Table(myStack, 'GameScores', {
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: props.isDevelopmentEnv ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
  pointInTimeRecovery: true,
  encryption: TableEncryption.CUSTOMER_MANAGED,
  encryptionKey: props.dynamoDbKmsKey,
  tableName: `${props.dbPrefix}-GameScores`,
  partitionKey: { name: 'username', type: AttributeType.STRING },
})
```

### 3.2. Create the Dynamoose Schema

You then need to create a schema around the table like this:
```ts
import { Schema } from 'dynamoose';
import type { ModelDefinition } from 'nestjs-dynamoose';

export const GameScoresModelDefinition: ModelDefinition = {
  name: 'GameScores',
  schema: new Schema(uid: {
    type: String,
    hashKey: true,
  },
  score: {
    type: Number,
  }, {
    saveUnknown: false,
    timestamps: true,
  }),
};
```

The Schema needs to be added to the relevant module, for example the `ApiHandlerModule`:

```ts
@Global()
@Module({
  imports: [DynamooseModule.forFeature([GameScoresModelDefinition])],
})
export class ApiHandlerModule {}
```

This will automatically provide a dynamoose client to interact with that table.

### 3.3. Write a service providing access to the data

The next step is to write a service:

```ts
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

// ...

interface GameScoresKey {
  username:string;
}

interface GameScores extends GameScoresKey {
  score:number;
}

@Injectable()
export class GameScoresService {
  constructor(
    @InjectModel(GameScoresModelDefinition.name)
    private gameScoresModel: Model<GameScores, GameScoresKey>,
  ) {}

  get(key: GameScoresKey): Promise<GameScores | undefined> {
    return this.gameScoresModel.get(key);
  }

  async createOrUpdate(gameScore: GameScores): Promise<UserInstitution> {
    const key: UserInstitutionKey = { username: gameScore.username };
    const existing = await this.gameScoresModel.get(key);
    if (!existing) {
      return this.gameScoresModel.create(gameScore);
    }
    return this.gameScoresModel.update(key, { score: gameScore.score });
  }

  async delete(key: GameScoresKey): Promise<void> {
    return this.gameScoresModel.delete(key);
  }
}
```

### 3.4. Further steps
Now you need to provide this service in the modules that you want to use it in. Finally, depending on your use case, you can replace API endpoints and parts of the UI as described in [2.3. Replace API endpoints for type safe fields](#23-replace-api-endpoints-for-type-safe-fields) and [2.4. Show Custom Claims in the UI](#24-show-custom-claims-in-the-ui).