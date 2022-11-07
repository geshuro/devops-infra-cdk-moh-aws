import { createHash } from 'crypto';

/**
 * Creates a unique 10 character hash to use for CDK toolkit separation
 */
export function cdkQualifier(name: string): string {
  return createHash('md5').update(name).digest('hex').substr(0, 10);
}
