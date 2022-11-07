import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Key } from '@aws-cdk/aws-kms';
import {
  AttributeType,
  BillingMode,
  Table,
  TableEncryption,
  StreamViewType,
} from '@aws-cdk/aws-dynamodb';

interface ArticleTableProps {
  namespace: string;
  dbPrefix: string;
  removalPolicy: RemovalPolicy;
}

export class ArticleTable {
  public readonly table: Table;
  public readonly key: Key;

  constructor(readonly scope: Construct, props: ArticleTableProps) {
    this.key = new Key(scope, 'ArticleTableEncryptionKey', {
      alias: `${props.namespace}-article-table-key`,
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy,
    });

    this.table = new Table(scope, 'DbArticle', {
      tableName: `${props.dbPrefix}-Article`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy,
      pointInTimeRecovery: true,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.key,
      stream: StreamViewType.NEW_IMAGE,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: 'ScreeningIdIndex',
      partitionKey: { name: 'screeningId', type: AttributeType.STRING },
      sortKey: { name: 'id', type: AttributeType.STRING },
    });
  }
}
