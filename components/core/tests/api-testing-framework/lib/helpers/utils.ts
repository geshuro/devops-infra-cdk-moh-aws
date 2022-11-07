import _ from 'lodash';

/**
 * Updates a JSON Web Token's (JWT's) claims/properties, returning a new JWT with the applied updates. The new JWT is
 * not valid since it is not resigned, however. This allows tests to simulate JWT tampering attacks against APIs by
 * spoofing various claims within the JWT.
 * @param {string} token The JWT to be updated
 * @param {object} param1
 * @param {object} param1.headerUpdates The JOSE header parameters to be modified
 * @param {object} param1.bodyUpdates The JWT claims to be modified
 * @return {string} The updated, invalid JWT
 */
export function jwtTamper(
  token: string,
  {
    headerUpdates = {},
    bodyUpdates = {},
  }: { headerUpdates?: Record<string, unknown>; bodyUpdates?: Record<string, unknown> },
): string {
  // Extract/decode original header, body, and signature
  const [b64header, b64body, signature] = _.split(token, '.');

  const decodeObj = (str) => JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
  const header = decodeObj(b64header);
  const body = decodeObj(b64body);

  // Update values
  const updateAttrs = (obj, updates) =>
    _.forEach(updates, (val, key) => {
      obj[key] = val;
    });
  updateAttrs(header, headerUpdates);
  updateAttrs(body, bodyUpdates);

  // Re-encode/rejoin updated header and body with signature
  const encodeObj = (obj) => _.trimEnd(Buffer.from(JSON.stringify(obj)).toString('base64'), '=');
  return _.join([encodeObj(header), encodeObj(body), signature], '.');
}

/**
 * Runs the provided async function and prints the error object (if any) to the console, it does NOT rethrow
 * the error
 */
export async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return undefined;
  }
}
