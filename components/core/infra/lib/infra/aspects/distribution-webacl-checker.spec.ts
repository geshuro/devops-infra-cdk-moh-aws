import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { HttpOrigin } from '@aws-cdk/aws-cloudfront-origins';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { DistributionWebAclChecker } from './distribution-webacl-checker';

describe('distribution web ACL aspect', () => {
  test('should add an error message for distributions without web ACL', () => {
    // GIVEN
    const stack = new Stack();
    new Distribution(stack, 'Distribution', {
      defaultBehavior: {
        origin: new HttpOrigin('www.example.com'),
      },
    });

    // WHEN
    Aspects.of(stack).add(new DistributionWebAclChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/Distribution/Resource',
          level: 'error',
          message: 'Distribution web ACL should be set.',
        },
      ]),
    );
  });

  test('should not add an error message for distributions with web ACL', () => {
    // GIVEN
    const stack = new Stack();
    new Distribution(stack, 'Distribution', {
      webAclId: '1',
      defaultBehavior: {
        origin: new HttpOrigin('www.example.com'),
      },
    });

    // WHEN
    Aspects.of(stack).add(new DistributionWebAclChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
