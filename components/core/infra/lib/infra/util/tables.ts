import { Construct } from '@aws-cdk/core';
import { Table, TableProps, GlobalSecondaryIndexProps } from '@aws-cdk/aws-dynamodb';
import { Grant, IGrantable } from '@aws-cdk/aws-iam';
import { IKey } from '@aws-cdk/aws-kms';

const tableReadWriteActions = [
  'dynamodb:DescribeTable',
  'dynamodb:BatchGetItem',
  'dynamodb:GetRecords',
  'dynamodb:GetShardIterator',
  'dynamodb:Query',
  'dynamodb:GetItem',
  'dynamodb:Scan',
  'dynamodb:ConditionCheckItem',
  'dynamodb:BatchWriteItem',
  'dynamodb:PutItem',
  'dynamodb:UpdateItem',
  'dynamodb:DeleteItem',
];
const keyReadWriteActions = ['kms:Decrypt', 'kms:DescribeKey', 'kms:Encrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*'];

export interface AddTableProps extends TableProps {
  /**
   * Global Secondary Indexes
   */
  indexes?: GlobalSecondaryIndexProps[];
}

/**
 * A convenient wrapper construct to handle multiple DynamoDB tables
 */
export abstract class Tables extends Construct {
  private allTables: Table[] = [];
  private tablesWithIndex: Table[] = [];

  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  /**
   * Use this to add a table to this construct
   *
   * @param id The id
   * @param props The props are the same as the CDK Table constructor plus
   * the `indexes` array that allows you to create GSIs
   * @returns The new table
   */
  protected addTable(id: string, props: AddTableProps): Table {
    const table = new Table(this, id, props);
    props.indexes?.forEach((idx) => table.addGlobalSecondaryIndex(idx));
    this.registerTable(table, !!props.indexes?.length);
    return table;
  }

  private registerTable(table: Table, hasIndex: boolean) {
    this.allTables.push(table);
    if (hasIndex) {
      this.tablesWithIndex.push(table);
    }
  }

  /**
   * Grants read and write permissions to all tables of this construct
   *
   * @param grantees The resources to grant permissions to
   */
  grantReadWriteData(...grantees: IGrantable[]): void {
    // Collect all table and index ARNs
    const tableArns = [
      ...this.allTables.map((table) => table.tableArn),
      ...this.tablesWithIndex.map((table) => `${table.tableArn}/index/*`),
    ];

    // Collect up all distinct encryption keys (if any)
    const keys = new Set<IKey>(
      [...this.allTables, ...this.tablesWithIndex]
        .filter((table) => !!table.encryptionKey)
        .map((table) => table.encryptionKey!),
    );

    grantees.forEach((grantee) => {
      // Grant table access
      Grant.addToPrincipal({
        grantee,
        actions: tableReadWriteActions,
        resourceArns: tableArns,
        scope: this,
      });

      // Grant key access
      Array.from(keys).forEach((key) => {
        key.grant(grantee, ...keyReadWriteActions);
      });
    });
  }
}
