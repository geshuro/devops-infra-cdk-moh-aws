import { AttributeType, BillingMode, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { IKey } from '@aws-cdk/aws-kms';

export interface RevokedAccessTableProps {
  dbPrefix: string;
  dynamoDbKmsKey: IKey;
}

export class RevokedAccessTable extends Table {
  constructor(scope: Construct, props: RevokedAccessTableProps) {
    super(scope, 'RevokedAccessTable', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Contains ephemeral data only
      pointInTimeRecovery: true,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.dynamoDbKmsKey,
      tableName: `${props.dbPrefix}-RevokedAccess`,
      partitionKey: { name: 'username', type: AttributeType.STRING },
      sortKey: { name: 'sig', type: AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
    });
  }
}
