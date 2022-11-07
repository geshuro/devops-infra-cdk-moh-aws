import { AttributeType, BillingMode, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import { Construct, RemovalPolicy } from '@aws-cdk/core';
import type { IKey } from '@aws-cdk/aws-kms';
import { Tables } from '@aws-ee/core-infra';

export class PostDeploymentTables extends Tables {
  public readonly deploymentStoreDb: Table;

  constructor(
    scope: Construct,
    props: {
      dbDeploymentStore: string;
      isDevelopmentEnv: boolean;
      dynamoDbKmsKey: IKey;
    },
  ) {
    super(scope, 'PostDeploymentTables');

    const removalPolicy = props.isDevelopmentEnv ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    this.deploymentStoreDb = this.addTable('DbDeploymentStore', {
      tableName: props.dbDeploymentStore,
      partitionKey: { name: 'type', type: AttributeType.STRING },
      sortKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy,
      pointInTimeRecovery: true,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.dynamoDbKmsKey,
    });
  }
}
