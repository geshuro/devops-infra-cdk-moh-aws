import { logger } from '@aws-ee/common';
import { PolicyDocument } from '@aws-cdk/aws-iam';
import { IAM } from '@aws-sdk/client-iam';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

import { ResolvedAccount } from '../models/resolved-account';

interface CloudFormationExecRoleHelperProps {
  awsRegion: string;
  awsProfile: string;
  cloudFormationExecutionPolicyDoc: PolicyDocument;
  namespace: string;
  account: ResolvedAccount;
}

export class CloudFormationExecRoleHelper {
  private iamClient: IAM;

  constructor(private props: CloudFormationExecRoleHelperProps) {
    this.iamClient = new IAM({
      region: this.props.awsRegion,
      credentials: defaultProvider({ profile: this.props.awsProfile }),
    });
  }

  async createOrUpdatePolicy(): Promise<void> {
    const policyArn = this.policyArn;
    const existingPolicy = await this.tryGetPolicyDoc(policyArn);

    if (existingPolicy) {
      const newDocJson = JSON.stringify(this.props.cloudFormationExecutionPolicyDoc);

      if (existingPolicy.doc === newDocJson) {
        logger.info('CloudFormation Execution Policy has not changed.');
        return;
      }

      this.updatePolicy(policyArn, existingPolicy.versionId);

      logger.info('CloudFormation Execution Policy updated successfully.');
    } else {
      await this.createPolicy();

      logger.info('CloudFormation Execution Policy created successfully.');
    }
  }

  get policyArn(): string {
    return `arn:${this.props.account.awsPartition}:iam::${this.props.account.awsAccountId}:policy/${this.policyName}`;
  }

  private get policyName() {
    return `${this.props.namespace}-cloudformation-exec`;
  }

  private async tryGetPolicyDoc(PolicyArn: string) {
    try {
      const existingPolicy = await this.iamClient.getPolicy({ PolicyArn });
      const existingVersion = await this.iamClient.getPolicyVersion({
        PolicyArn,
        VersionId: existingPolicy.Policy?.DefaultVersionId,
      });

      return {
        doc: decodeURIComponent(existingVersion.PolicyVersion!.Document!),
        versionId: existingVersion.PolicyVersion!.VersionId!,
      };
    } catch (e) {
      logger.warn(e as string);
    }
    return undefined;
  }

  private async createPolicy() {
    await this.iamClient.createPolicy({
      PolicyName: this.policyName,
      PolicyDocument: JSON.stringify(this.props.cloudFormationExecutionPolicyDoc),
      Description: `The policy CloudFormation assumes to deploy [${this.props.namespace}]`,
    });
  }

  private async updatePolicy(PolicyArn: string, OldVersionId: string) {
    // create new version
    await this.iamClient.createPolicyVersion({
      PolicyArn,
      PolicyDocument: JSON.stringify(this.props.cloudFormationExecutionPolicyDoc),
      SetAsDefault: true,
    });

    // remove previous version
    await this.iamClient.deletePolicyVersion({
      PolicyArn,
      VersionId: OldVersionId,
    });
  }
}
