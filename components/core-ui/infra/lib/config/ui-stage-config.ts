export enum HostingType {
  /**
   * The website will be served from a CloudFront CDN
   */
  CloudFront,

  /**
   * The website will be proxied via the API Gateway
   */
  ApiGateway,
}

export interface VersionDisclaimerInterface {
  header: string;
  content: string;
}

export interface UiStageConfig {
  solutionFullName: string;
  versionDisclaimer?: VersionDisclaimerInterface;

  /**
   * The UI hosting approach
   *
   * @default HostingType.ApiGateway
   */
  uiHostingType?: HostingType;
}
