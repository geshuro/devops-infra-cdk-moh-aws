// This is to replace the third party library https://github.com/brianloveswords/base64url
// The library was creating an error during the runtime of a local lambda invocation in post deployment.
// In general, we don't need to encode/decode when sending data to the UI even if we think this data needs
// to come back in a query parameter. The reason is that most libraries already handle the url/query parameter
// encoding and decoding, there is no need to be doing this on the server side.

// This code is inspired by https://github.com/joaquimserafim/base64-url/blob/v2.3.3/index.js

export function encodeBase64(str = '', encoding: BufferEncoding = 'utf8'): string {
  // First, we use the builtin base64 encoding using the Buffer class.
  const encoded = Buffer.from(str, encoding).toString('base64');

  // The encoded string is expected to be base64 but not fully ready for a url inclusion
  // We will replace '+' with '-', '/' with '_' and '=' with ''.
  // See https://base64.guru/standards/base64url

  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeBase64(str = '', encoding: BufferEncoding = 'utf8'): string {
  // str is based64 with additional replacement as discussed here https://base64.guru/standards/base64url
  // Before we can decode the base64 using the builtin base64 decoder, we first need to 'unescape' the
  // characters that we replaced in the 'encode' function. In addition, we need to account for the base 64
  // '=' padding.
  const padded = str + '==='.slice((str.length + 3) % 4);

  const encoded = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(encoded, 'base64').toString(encoding);
}
