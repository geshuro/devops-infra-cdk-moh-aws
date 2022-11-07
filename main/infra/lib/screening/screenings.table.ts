import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Key } from '@aws-cdk/aws-kms';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
  TableEncryption,
} from '@aws-cdk/aws-dynamodb';

interface ScreeningsTableProps {
  namespace: string;
  dbPrefix: string;
  removalPolicy: RemovalPolicy;
}

export class ScreeningsTable {
  public readonly key: Key;
  public readonly table: Table;

  constructor(readonly scope: Construct, props: ScreeningsTableProps) {
    this.key = new Key(scope, 'ScreeningsTableEncryptionKey', {
      alias: `${props.namespace}-screenings-table-key`,
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy,
    });

    this.table = new Table(scope, 'DbScreeningStatus', {
      tableName: `${props.dbPrefix}-Screenings`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy,
      pointInTimeRecovery: true,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.key,
      stream: StreamViewType.NEW_IMAGE,
    });
  }
}
