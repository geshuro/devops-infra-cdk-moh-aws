import { bootstrap } from './lib/bootstrap';
import { ResourceNode } from './lib/resources/resource';
import { CollectionResourceNode } from './lib/resources/collection-resource';
import { getToken } from './lib/setup/token';
import { getProjectConfigs } from './lib/setup/project-config';
import * as utils from './lib/helpers/utils';
import errorCode from './lib/setup/error-code';
import * as maliciousData from './lib/data/malicious';
import * as string from './lib/helpers/string';
import { getCallerAccountId } from './lib/aws/caller-account-id';
import { generatePassword } from './lib/helpers/generate-password';

export * from './lib/setup/client-session';
export * from './lib/setup/axios-error';
export * from './lib/setup/setup';
export * from './lib/models/session-type';

export {
  bootstrap,
  ResourceNode,
  CollectionResourceNode,
  getToken,
  utils,
  errorCode,
  getProjectConfigs,
  maliciousData,
  string,
  getCallerAccountId,
  generatePassword,
};
