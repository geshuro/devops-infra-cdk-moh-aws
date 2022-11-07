import { Construct, Resource } from '@aws-cdk/core';
import { IUserPoolIdentityProvider, CfnUserPoolIdentityProvider, UserPool } from '@aws-cdk/aws-cognito';

export interface UserPoolIdentityProviderSamlProps {
  id: string;
  metadata: string;
  name: string;
  userPool: UserPool;
  attributeMapping?: Record<string, string>;
}

export class UserPoolIdentityProviderSaml extends Resource implements IUserPoolIdentityProvider {
  readonly providerName: string;

  constructor(scope: Construct, id: string, props: UserPoolIdentityProviderSamlProps) {
    super(scope, id);
    props.userPool.registerIdentityProvider(this);

    const resource = new CfnUserPoolIdentityProvider(this, 'Resource', {
      providerDetails: {
        MetadataFile: props.metadata,
      },
      providerName: props.name,
      providerType: 'SAML',
      userPoolId: props.userPool.userPoolId,
      attributeMapping: props.attributeMapping ?? {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
        given_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
        family_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
        email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      },
      idpIdentifiers: [props.id],
    });

    this.providerName = super.getResourceNameAttribute(resource.ref);
  }
}
