import { Ability, AbilityBuilder, AbilityClass, InferSubjects } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import {
  Action,
  AuthorizationProvider,
  addCoreAbilities,
  CoreRoleSet,
  CoreSubjects,
  RoleSet,
  DynamooseTypeMap,
  dynamooseSubjectDetector,
  Principal,
} from '@aws-ee/core';
import { Screening } from '../models/screening';

/**
 * Subjects are the targets of abilities. Add more subjects here as needed.
 */
export type Subjects = CoreSubjects | InferSubjects<typeof Screening>;

/**
 * You can extend the possible actions here.
 * Check the CASL docs for more info.
 */
export type AuthorizationAbility = Ability<[Action, Subjects]>;

/**
 * This is needed for all types that are accessed via dynamoose
 * Dynamoose adds a string field (originalName) which we use to map back to the class
 * constructor so we can write class-based CASL rules.
 *
 * The mapping is the "net" table name to the type, for example,
 * if the DynamoDB table if called `thglaser-ldn-sstx-MyGizmos` and it maps to the `MyGizmo` type,
 * the mapping is: { MyGizmos: MyGizmo }
 */
const dynamooseDataMap: DynamooseTypeMap = {
  // ... add mappings for types that are stored in dynamo and used as CASL subjects
};

@Injectable()
export class AuthorizationProviderService implements AuthorizationProvider {
  async getRoles(): Promise<RoleSet> {
    /**
     * Return additional roles here or remove roles from the core set
     *
     * @example
     * return {...CoreRoleSet, myRole: new UserRole({id:myRole, etc.})}
     */
    return CoreRoleSet;
  }

  async getUserAbilities(principal: Principal): Promise<AuthorizationAbility> {
    const builder = new AbilityBuilder<AuthorizationAbility>(Ability as AbilityClass<AuthorizationAbility>);

    // Mixin to add the core abilities (user management etc.)
    addCoreAbilities(principal, builder);

    const { can } = builder;
    // anyone can manage a screening, so no check for principal's user role
    can(Action.Manage, Screening);

    return builder.build({
      detectSubjectType: dynamooseSubjectDetector({
        mappings: dynamooseDataMap,
      }),
    });
  }
}
