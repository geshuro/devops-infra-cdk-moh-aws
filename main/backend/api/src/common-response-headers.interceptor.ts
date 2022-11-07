import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { Response as ExpressResponse } from 'express';

/**
 * Adds common http response headers
 */
@Injectable()
export class CommonResponseHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const resp: ExpressResponse = context.switchToHttp().getResponse<ExpressResponse>();
    resp.set({
      'strict-transport-security': 'max-age=63072000; includeSubdomains',
      'content-security-policy': `default-src 'self'`, // add additional rules delimited by "; "
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'same-origin',
      'cache-control': 'no-cache, no-store',
    });
    return next.handle();
  }
}
