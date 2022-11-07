import type { RequestContext, Principal } from '@aws-ee/core';

export interface ResponseLocals {
  token?: string;
  principal?: Principal;
  authenticated: boolean;
  requestContext: RequestContext;
}
