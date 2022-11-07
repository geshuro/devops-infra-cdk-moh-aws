import { Construct } from '@aws-cdk/core';
import { AwsCustomResource, AwsSdkCall, AwsCustomResourcePolicy, PhysicalResourceId } from '@aws-cdk/custom-resources';

interface SSMParameterReaderProps {
  /**
   * Name of the SSM Parameter
   */
  parameterName: string;

  /**
   * Region where the SSM Parameter lives
   */
  region: string;

  /**
   * List of resource ARNs that this custom resource will be allowed access to
   */
  resources: string[];

  /**
   * Unique resource ID of this custom resource
   *
   * Note: If left blank, the resource will update on every deployment which may take more time.
   * Only leave this blank if the parameter updates frequently.
   */
  resourceId?: string;
}

/**
 * A custom resource that reads a parameter from SSM
 */
export class SSMParameterReader extends AwsCustomResource {
  constructor(scope: Construct, name: string, props: SSMParameterReaderProps) {
    const { parameterName, region } = props;

    const ssmAwsSdkCall: AwsSdkCall = {
      service: 'SSM',
      action: 'getParameter',
      parameters: {
        Name: parameterName,
      },
      region,
      physicalResourceId: getPhysicalResourceId(props.resourceId),
    };

    super(scope, name, {
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: props.resources }),
      onUpdate: ssmAwsSdkCall,
    });
  }

  getParameterValue(): string {
    return this.getResponseField('Parameter.Value').toString();
  }
}

function getPhysicalResourceId(id?: string): PhysicalResourceId {
  if (id) {
    return PhysicalResourceId.of(id);
  }
  return { id: Date.now().toString() }; // Update physical id to always fetch the latest version
}
