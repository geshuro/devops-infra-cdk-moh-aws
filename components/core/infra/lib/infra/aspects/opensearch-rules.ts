import { Annotations, IAspect, IConstruct } from '@aws-cdk/core';
import { CfnDomain } from '@aws-cdk/aws-opensearchservice';
import { checkResolvable } from '../util/check-resolvable';

export interface OpenSearchNetworkingCheckerProps {
  isDevelopmentEnv: boolean;
}

export class OpenSearchRules implements IAspect {
  constructor(private props: OpenSearchNetworkingCheckerProps) {}

  visit(node: IConstruct): void {
    if (node instanceof CfnDomain) {
      this.checkVpcStatus(node);
      this.checkEncryptionAtRest(node);
      this.checkNodeToNodeEncryption(node);
    }
  }

  private checkVpcStatus(domain: CfnDomain) {
    if (!domain.vpcOptions) {
      if (this.props.isDevelopmentEnv) {
        Annotations.of(domain).addWarning(
          'OpenSearch Domain with internet endpoint detected. This is OK for development but is not allowed for Demo and Prod.',
        );
      } else {
        Annotations.of(domain).addError('OpenSearch Domains should be installed into a VPC.');
      }
    }
  }

  private checkEncryptionAtRest(domain: CfnDomain) {
    checkResolvable({
      resource: domain,
      config: domain.encryptionAtRestOptions,
      message: 'Encryption at rest must be enabled.',
      severity: 'error',
      passCondition: (ear) => !!ear?.enabled,
    });
  }

  private checkNodeToNodeEncryption(domain: CfnDomain) {
    checkResolvable({
      resource: domain,
      config: domain.nodeToNodeEncryptionOptions,
      message: 'Node to node encryption must be enabled.',
      severity: 'error',
      passCondition: (ntn) => !!ntn?.enabled,
    });
  }
}
