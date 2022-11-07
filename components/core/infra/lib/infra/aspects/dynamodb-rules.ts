import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnTable, Table } from '@aws-cdk/aws-dynamodb';
import { checkResolvable } from '../util/check-resolvable';

export class DynamoDbRules implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof CfnTable) {
      this.checkPointInTimeRecovery(node);
    }
    if (node instanceof Table) {
      this.checkCmkEncryption(node);
    }
  }

  private checkPointInTimeRecovery(table: CfnTable) {
    checkResolvable({
      resource: table,
      config: table.pointInTimeRecoverySpecification,
      message: 'Point in time recovery should be enabled.',
      severity: 'warning',
      passCondition: (pit) => !!pit?.pointInTimeRecoveryEnabled,
    });
  }

  private checkCmkEncryption(table: Table) {
    if (!table.encryptionKey) {
      Annotations.of(table).addWarning('Table should be encrypted with a CMK.');
    }
  }
}
