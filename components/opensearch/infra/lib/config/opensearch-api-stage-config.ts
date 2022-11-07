import { EngineVersion } from '@aws-cdk/aws-opensearchservice';
import { EbsDeviceVolumeType } from '@aws-cdk/aws-ec2';

export enum OpenSearchMode {
  /**
   * Import an existing OpenSearch Domain
   */
  Import,

  /**
   * Create a new OpenSearch Domain
   */
  Create,
}

interface OpenSearchApiImportStageConfig {
  /**
   * The mode of OpenSearch creation.
   *
   * `OpenSearchMode.Import` - use an existing OpenSearch domain
   *
   * `OpenSearchMode.Create` - create a new OpenSearch domain
   */
  openSearchMode: OpenSearchMode.Import;

  /**
   * Specify the existing Domain Endpoint.
   */
  openSearchEndpoint: string;

  /**
   * The OpenSearch domain name
   */
  openSearchDomainName: string;

  /**
   * The OpenSearch version
   */
  openSearchVersion: EngineVersion;
}

interface OpenSearchApiCreateStageConfig {
  /**
   * The mode of OpenSearch creation.
   *
   * `OpenSearchMode.Import` - use an existing OpenSearch domain
   *
   * `OpenSearchMode.Create` - create a new OpenSearch domain
   */
  openSearchMode: OpenSearchMode.Create;

  /**
   * The OpenSearch domain name
   *
   * @default - A unique name will be generated
   */
  openSearchDomainName?: string;

  /**
   * The OpenSearch version
   *
   * @default EngineVersion.ELASTICSEARCH_7_10
   */
  openSearchVersion?: EngineVersion;

  /**
   * The number of data nodes (instances) to use in the Amazon OS domain.
   *
   * @default 1
   */
  openSearchInstanceCount?: number;

  /**
   * The Instance type to use in the domain.
   *
   * @see https://aws.amazon.com/opensearch-service/pricing/
   * @default "r6g.large.search"
   */
  openSearchInstanceType?: string;

  /**
   * The size (in GiB) of the EBS volume for each data node
   *
   * @default 50
   */
  openSearchVolumeSizeGb?: number;

  /**
   * The EBS volume type to use with the Amazon OS domain, such as standard, gp2, or io1.
   *
   * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-volume-types.html
   * @default "gp2"
   */
  openSearchVolumeType?: EbsDeviceVolumeType;
}

export type OpenSearchApiStageConfig = OpenSearchApiImportStageConfig | OpenSearchApiCreateStageConfig;
