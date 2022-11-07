import type {
  CloudFrontFunctionsResponseEvent,
  CloudFrontFunctionsResponse,
} from '../../models/cloudfront-function.types';

const config = {
  connectSrc: '{{ API_BASE_URL }} {{ OTHER_CONNECT_SRC }}',
  otherImgSrc: '{{ OTHER_IMG_SRC }}',
  otherFrameSrc: '{{ OTHER_FRAME_SRC }}',
};

/**
 * Web security handler
 *
 * Adds content security headers to the CloudFront response.
 *
 * Note: function needs to be called "handler" and not(!) exported.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handler(event: CloudFrontFunctionsResponseEvent): CloudFrontFunctionsResponse {
  // Get contents of cloudfront response
  const response = event.response;
  const headers = response.headers;

  // Set new headers
  headers['strict-transport-security'] = {
    value: 'max-age=63072000; includeSubdomains',
  };

  const cspRules = [
    `default-src 'self'`,
    `connect-src ${config.connectSrc}`,
    `img-src 'self' ${config.otherImgSrc} data:`,
    `script-src 'self' blob:`,
    `style-src 'self' 'unsafe-inline'`,
    `frame-src 'self' ${config.otherFrameSrc}`,
    `font-src 'self' data:`,
  ];
  headers['content-security-policy'] = {
    value: cspRules.join('; '),
  };

  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'SAMEORIGIN' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  headers['referrer-policy'] = { value: 'same-origin' };

  // Return modified response
  return response;
}
