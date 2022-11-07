import { Injectable } from '@nestjs/common';
import { Principal } from '../models/principal';
import { RequestContext } from '../models/request-context';

@Injectable()
export class ContextService {
  private currentContext?: RequestContext;

  clear(): void {
    this.currentContext = undefined;
  }

  set(context: RequestContext): void {
    this.currentContext = context;
  }

  getCurrentPrincipal(): Principal | undefined {
    return this.currentContext?.principal;
  }

  getCurrentPrincipalId(): string | undefined {
    return this.currentContext?.principal?.uid;
  }
}
