# Infrastructure

- [1. Environment Types](#1-environment-types)
- [2. Data](#2-data)
- [3. Security enforcement](#3-security-enforcement)

The infrastructure code is validated against a set of rules. There are rules that check conditions and there are rules that apply changes. The severity of the checks varies depending on the environment type. There are also some differences in how data is treated.

## 1. Environment Types

The following environment types are defined:

- `Dev` intended for development only.
- `Demo` for demo accounts.
- `Prod` intended for production

## 2. Data

Data is treated differently depending on environment. The differences are:

- In a `Dev` environment, all data is treated as replaceable. This means that all data stores are destroyed when the application is removed via the CLI or directly via CloudFormation. For example, all S3 buckets are automatically emptied and destroyed, also all data in DynamoDB tables will be lost when the solution is destroyed.

- In `Demo` and `Prod` environments, all data stores are created with the CloudFormation removal policy of `Retain` which means they are kept when the solution is destroyed and have to be manually deleted.

## 3. Security enforcement

There are two types of enforcement:

- `Report` where infrastructure violations are being logged out when the solution is deployed
- `Apply` where the recommended changes are directly applied to the infrastructure

When a violation is reported, there are three types of severity:

- `Info` the finding is for consideration only
- `Warning` the finding is a serious concern
- `Error` the finding will stop the deployment

The following rules currently exist in the system

| Description | Type | Severity in Dev | Severity in Demo/Prod |
| - | - | - | - |
| API stage logging should be enabled | Report | Warning | Warning |
| S3 Bucket access logging should be enabled | Report | Warning | Error |
| S3 Buckets should be encrypted at rest | Report | Error | Error |
| S3 Buckets should have a resource policy that prevents access without TLS or SigV4 | Apply | N/A | N/A |
| S3 Buckets should have versioning enabled | Report | Info | Info |
| DynamoDB Tables should have Point-In-Time recovery enabled | Report | Warning | Warning |
| DynamoDB Tables should be encrypted with a CMK | Report | Warning | Warning |
| CloudFront Distributions must have a WAF assigned | Report | Error | Error |
| KMS Keys must have key rotation enabled | Report | Error | Error |
| OpenSearch Clusters must reside in a VPC | Report | Warning | Error |
| OpenSearch Clusters must be encrypted at rest | Report | Error | Error |
| OpenSearch Clusters must have node to node encryption enabled | Report | Error | Error |
| Stepfunctions State Machines should have logging enabled | Report | Warning | Warning |
| Cognito UserPool should have a password policy | Report | Warning | Warning |

These warnings will be shown as part of the deployment, here is some example output:

```
[Info at /mystage-region-mypoc/core/LoggingBucket/Resource] Bucket is not versioned. Consider enabling this if the bucket contains critical data.
[Info at /mystage-region-mypoc/opensearch] The OpenSearch domain uses an internet endpoint.
[Warning at /mystage-region-mypoc/opensearch/OpenSearch/Resource] OpenSearch Domain with internet endpoint detected. This is OK for development but is not allowed for Demo and Prod.
[Info at /mystage-region-mypoc/webinfra/WebsiteBucket/Resource] Bucket is not versioned. Consider enabling this if the bucket contains critical data.
[Info at /mystage-region-mypoc/webinfra/DocsSiteBucket/Resource] Bucket is not versioned. Consider enabling this if the bucket contains critical data.
[Info at /mystage-region-mypoc/webinfra/WebsiteCloudFrontWeb] This CloudFront Distribution will be invalidated as part of the UI deployment.
[Info at /mystage-region-mypoc/backend/AssetsBucket/Resource] Bucket is not versioned. Consider enabling this if the bucket contains critical data.
```

> **Please watch out for these warnings to avoid surprises when deploying infrastructure!**
