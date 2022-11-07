import 'regenerator-runtime';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Handler } from 'aws-lambda';
import { SignUpConfirmationRunner } from '@aws-ee/core-auth-cognito';
import { SignUpConfirmationHandlerModule } from './signup-confirmation-handler.module';


const bootstrap = (): Promise<INestApplicationContext> =>
  NestFactory.createApplicationContext(SignUpConfirmationHandlerModule);

const contextPromise = bootstrap();

export const handler: Handler = async (event) => {
  console.log(JSON.stringify(event));
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event;
  }
  const userDetails = event.request.userAttributes;
  // Preparing authProviderId similar to how we generate add user
  const authProviderId = `https://cognito-idp.${event.region}.amazonaws.com/${event.userPoolId}`;
  const identityProviderName = `Cognito (${event.userPoolId})`;
  const context = await contextPromise;
  const confirmationRunner = context.get(SignUpConfirmationRunner);
  await confirmationRunner.postConfirm({
    email: userDetails.email,
    status: 'active',
    // Setting default role to "guest"
    userRole: 'guest',
    username: event.userName,
    // Setting Defaults
    authenticationProviderId: authProviderId,
    identityProviderName,
    createdBy: userDetails.email,
    ns: authProviderId,
  });
  return event;
};
