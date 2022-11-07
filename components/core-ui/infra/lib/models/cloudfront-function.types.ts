// CloudFront function typings according to
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-response

interface NamedValue {
  value: string;
}

interface NamedValueOrMultiValue extends NamedValue {
  multiValue?: NamedValue[];
}

interface CookieResponseValue extends NamedValueOrMultiValue {
  attributes?: string;
}

type NamedValueMap = Record<string, NamedValueOrMultiValue>;
type CookieResponseNamedValueMap = Record<string, CookieResponseValue>;

export interface CloudFrontFunctionsRequest {
  method: string;
  uri: string;
  querystring: NamedValueMap;
  headers: NamedValueMap;
  cookies: NamedValueMap;
}

export interface CloudFrontFunctionsResponse {
  statusCode: number;
  statusDescription?: string;
  headers: NamedValueMap;
  cookies?: CookieResponseNamedValueMap;
}

export interface CloudFrontFunctionsContext {
  distributionDomainName: string;
  distributionId: string;
  eventType: 'viewer-request' | 'viewer-response';
  requestId: string;
}

export interface CloudFrontFunctionsViewer {
  ip: string;
}

export interface CloudFrontFunctionsRequestEvent {
  version: string;
  context: CloudFrontFunctionsContext;
  viewer: CloudFrontFunctionsViewer;
  request: CloudFrontFunctionsRequest;
}

export interface CloudFrontFunctionsResponseEvent extends CloudFrontFunctionsRequestEvent {
  response: CloudFrontFunctionsResponse;
}

export type CloudFrontFunctionsResult = CloudFrontFunctionsResponse | CloudFrontFunctionsRequest;
