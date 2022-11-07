import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { Domain, EngineVersion } from '@aws-cdk/aws-opensearchservice';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { Vpc } from '@aws-cdk/aws-ec2';
import { OpenSearchRules } from './opensearch-rules';
import { EnvType } from '../../config/core-stage-config';

describe('opensearch rules', () => {
  it.each`
    envType
    ${EnvType.Demo}
    ${EnvType.Prod}
  `('should add an error when a OS domain is not using VPC and the envType is $envType', ({ envType }) => {
    // GIVEN
    const stack = new Stack();
    new Domain(stack, 'Domain', {
      version: EngineVersion.ELASTICSEARCH_7_10,
      encryptionAtRest: { enabled: true },
      nodeToNodeEncryption: true,
    });

    // WHEN
    Aspects.of(stack).add(
      new OpenSearchRules({
        isDevelopmentEnv: envType === EnvType.Dev,
      }),
    );

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Domain/Resource',
          level: 'error',
          message: 'OpenSearch Domains should be installed into a VPC.',
        },
      ]),
    );
  });

  it('should add a warning when a OS domain is not using VPC and the envType is dev', () => {
    // GIVEN
    const stack = new Stack();
    new Domain(stack, 'Domain', {
      version: EngineVersion.ELASTICSEARCH_7_10,
      encryptionAtRest: { enabled: true },
      nodeToNodeEncryption: true,
    });

    // WHEN
    Aspects.of(stack).add(
      new OpenSearchRules({
        isDevelopmentEnv: true,
      }),
    );

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Domain/Resource',
          level: 'warning',
          message:
            'OpenSearch Domain with internet endpoint detected. This is OK for development but is not allowed for Demo and Prod.',
        },
      ]),
    );
  });

  it.each`
    envType
    ${EnvType.Demo}
    ${EnvType.Prod}
    ${EnvType.Dev}
  `('should not add any message when a VPC is configured in $envType', ({ envType }) => {
    // GIVEN
    const stack = new Stack();
    new Domain(stack, 'Domain', {
      version: EngineVersion.ELASTICSEARCH_7_10,
      encryptionAtRest: { enabled: true },
      nodeToNodeEncryption: true,
      vpc: new Vpc(stack, 'avpc'),
    });

    // WHEN
    Aspects.of(stack).add(
      new OpenSearchRules({
        isDevelopmentEnv: envType === EnvType.Dev,
      }),
    );

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
