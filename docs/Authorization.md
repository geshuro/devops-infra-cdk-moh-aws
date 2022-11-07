# Authorization

- [1. Prerequisites](#1-prerequisites)
- [2. Defining roles](#2-defining-roles)
- [3. Defining abilities](#3-defining-abilities)
  - [3.1. Adding subjects](#31-adding-subjects)
  - [3.2. Adding actions](#32-adding-actions)
  - [3.3. Conditions](#33-conditions)
- [4. Checking abilities](#4-checking-abilities)
  - [4.1. Using the RequestContext](#41-using-the-requestcontext)
  - [4.2. Using controller decorators](#42-using-controller-decorators)
  - [4.3. Using the UserAuthzService directly](#43-using-the-userauthzservice-directly)

We use [CASL](https://casl.js.org/) to perform all authorization related tasks. This guide outlines how we use CASL and what helpers are available.

## 1. Prerequisites

- Read the CASL sections
  - [getting started](https://casl.js.org/v5/en/guide/intro)
  - [rules](https://casl.js.org/v5/en/guide/define-rules)
  - [conditions](https://casl.js.org/v5/en/guide/conditions-in-depth)

## 2. Defining roles

Roles are defined in the central authorization point in `main/backend/common/lib/services/authorization-provider.service`. The relevant method is `getRoles()`, the default source code is shown here:

```ts
async getRoles(): Promise<RoleSet> {
  return CoreRoleSet;
}
```

You can add additional roles by amending this to:

```ts
async getRoles(): Promise<RoleSet> {
  return {...CoreRoleSet, author: new UserRole({ id:'author', /* other fields */ })};
}
```

The "other fields" are omitted from the example because TypeScript will tell you what fields you need to supply.

It is important that the key in the `RoleSet` matches the `id` of the `UserRole` because the key will be used for lookups. If you don't want the default rules from the `CoreSet` (`admin` and `guest`) you don't have to return the `CoreSet` at all or just a subset of it. For example, to only use the `admin` role and not the `guest`, you can:

```ts
async getRoles(): Promise<RoleSet> {
  return { admin: CoreRoleSet.admin };
}
```

**Note:** The method `getRoles()` is async, so if your roles are stored in a database, you can retrieve them and return them from this function.

**CAUTION**: The `getRoles()` method may be executed frequently so if you need to retrieve roles from somewhere, we recommend caching them in this service for better performance.

> **!** In the application code, we should never check if a user has a particular role. Instead, we should check for a fine grained ability.

With that in mind, it is clear that roles are not meaningful on their own, they need to be associated with abilities.

## 3. Defining abilities

Abilities are defined using the CASL syntax. The atomic unit of CASL is a **rule**. A collection of rules is an **ability**. Defining the ability of a user is done in a central point of the solution at `main/backend/common/lib/services/authorization-provider.service`, the same file that holds the roles. The relevant method is `getUserAbilities()` with the following default implementation:

```ts
export type Subjects = CoreSubjects;

export type AuthorizationAbility = Ability<[Action, CoreSubjects]>;

// ...

async getUserAbilities(principal: Principal): Promise<AuthorizationAbility> {
  const builder = new AbilityBuilder<AuthorizationAbility>(
    Ability as AbilityClass<AuthorizationAbility>);

  // Mixin to add the core abilities (user management etc.)
  addCoreAbilities(principal, builder);

  return builder.build({
    // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
  }) as unknown as AuthorizationAbility;
}
```

The `addCoreAbilities` mixin grants admin users the ability to manage `Users` and `UserRoles`.

**Note:** Administrators are not automatically granted the ability to do everything. If you want this, you need to grant abilities explicitly.

Here is how you would allow an admin to do everything (inside the `getUserAbilities()` method):

```ts
async getUserAbilities(principal: Principal): Promise<AuthorizationAbility> {
  // ...
  addCoreAbilities(principal, builder);

  if (principal.userRoles.includes(CoreRoles.Admin)) {
    builder.can(Action.Manage, 'all');
  }
  // ...
}
```

**Notes**:

- `Action.Manage` has a special meaning in CASL, it grants the ability to perform any action.
- The method `getUserAbilities()` is async, so if you need to go to the database to assemble your abilities, you can do so.

**CAUTION**: The `getUserAbilities()` method is executed on every request so if you need to retrieve additional data from somewhere, we recommend caching that in this service for better performance.

### 3.1. Adding subjects

Subjects are items that are targets of ability rules. For example, consider the following rule:

```ts
builder.can(Action.Delete, Widget);
```

The subject here is `Widget` and the rule grants the ability to delete a `Widget`.

All subjects must be classes. In our example:

```ts
class Widget {
  id: string;
  ownerId: string; // userId of the widget's owner
}
```

Next, we need to register our new subject with the `Subjects` type like this:

```ts
export type Subjects = InferSubjects<typeof User | typeof UserRole | typeof Widget> | 'all';
```

We we don't strictly need to re-add `User` and `UserRole` here, only if we want to write rules based on those subjects too. This is all just for TypeScript autocomplete and checking purposes.

Now that our new subject `Widget` is declared, we can write ability rules against it.

```ts
async getUserAbilities(principal: Principal): Promise<AuthorizationAbility> {
  // ...
  addCoreAbilities(principal, builder);

  if (principal.userRoles.includes(CoreRoles.Admin)) {
    builder.can(Action.Delete, Widget);
  }
  // ...
}
```

### 3.2. Adding actions

Actions are the actions that can be taken against a subject. By default, the following actions are available:

```ts
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

These actions don't have any partiicular meaning by themselves they just cover the most common use cases.

**Note**: `Action.Manage` has a special meaning in CASL, it grants the ability to perform any action.

You can add actions by defining your own enum type

```ts
enum MyAction {
  Transmogrify = 'transmogrify',
}
```

Then you can add your actions type wherever the `Action` parameter is used in the file. If you want both your actions and the default ones you can define a union type:

```ts
type AllActions = Action | MyAction;
```

```ts
async getUserAbilities(principal: Principal): Promise<AuthorizationAbility> {
  // ...
  addCoreAbilities(principal, builder);

  if (principal.userRoles.includes(CoreRoles.Admin)) {
    builder.can(MyAction.Transmogrify, Widget)
  }
  // ...
}
```

### 3.3. Conditions

Beyond _actions_ and _subjects_, CASL supports _conditions_. For example, you can express that a user can only update widgets that they own. The rule would look like this:

```ts
builder.can(Action.Update, Widget, { ownerId: user.id });
```

> CASL offers an entire query language for checking individual object permissions, check the [CASL docs](https://casl.js.org/v5/en/guide/conditions-in-depth) for more info.

## 4. Checking abilities

Once the roles and abilities are defined, we want to check them in our application. There are various ways of doing this which will be described in the following sections.

### 4.1. Using the RequestContext

In the API, the `RequestContext` object is created by a [middleware](https://docs.nestjs.com/middleware) before a request is executed. API controllers have access to the created `RequestContext` object via the `@Context()` parameter decorator. The following code snippet shows an example of a controller getting the `RequestContext`:

```ts
// ...
@Controller('/api/widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  async listWidgets(@Context() ctx: RequestContext) {
    return this.widgetsService.list(ctx);
  }
}
```

Once the `RequestContext` object is obtained, abilities can be checked using the `ability` field like in this example:

```ts
async list(ctx: RequestContext): Promise<ListResult<Widget>> {
  const canReadWidget = (widget: Widget) =>
    ctx.ability.can(Action.Read, widget);

  const widgets = await this.loadWidgets()

  return {
    items: widgets.filter(canReadWidget),
  };
}
```

The `list` method above only returns the data items where the user has _read_ ability for the _particular_ item. This sort of filtering becomes useful if the ability has been defined like this (see section above about defining abilities):

```ts
can(Action.Read, Widget, { ownerId: user.id });
```

This ability means that the user will only be able to read the widgets that the current user owns.

> CASL offers an entire query language for checking individual object permissions, check the [CASL docs](https://casl.js.org/v5/en/guide/conditions-in-depth) for more info.

You can also use the `RequestContext` for guard clauses by using the `assertAbility` field, like this:

```ts
async mustFind(ctx: RequestContext, { id }: { id: string }): Promise<Widget> {
  // ...
  const widget = await this.loadWidget(id)

  ctx.assertAbility.throwUnlessCan(Action.Read, widget);
  return widget;
}
```

### 4.2. Using controller decorators

There are also some decorators you can use to add guarding assertions to API endpoints. Consider the following example:

```ts
import { AbilityGuard, AssertAbilities, can } from '@aws-ee/core-rest-api';
// ...

@UseGuards(AbilityGuard)
@Controller('/api/widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  @AssertAbilities(can(Action.Read, Widget))
  async listWidgets(@Context() ctx: RequestContext) {
    return this.widgetsService.list(ctx);
  }
}
```

There are two relevant decorators here, `@AssertAbilities()` which allows you to define the required abilities for the endpoint and the `AbilityGuard` which verifies the abilities.

**Notes:**

- Without the `@UseGuards(AbilityGuard)` decorator, the `@AssertAbilities()` decorator will not work!
- The guard is evaluated before the controller method runs. This means that you can't check abilities against any particular data item because no data has been loaded yet.
- Notice that we use the subject class `Widget` here. It means "can the user read any widget" rather than a specific one like we did in the section before. Check the CASL docs for more info.

### 4.3. Using the UserAuthzService directly

In the rare case where you have a `User` object but no `RequestContext`, you can use the `UserAuthzService` directly. Inject it into your service class like you would any other service and then use it like in the following example:

```ts
async getWidgets(user:User) {
  const ability = await userAuthzService.getAbilitiesOf(user);

  if (ability.can(/* ... */)) {

  }

  // or
  ForbiddenError.from(ability).throwUnlessCan(/* ... */);
}
```
