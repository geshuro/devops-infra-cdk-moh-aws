import _ from 'lodash';
import path from 'path';

import { invokeMethodInDir } from '../helpers/invoke-method';
import { DependencyGraph } from '../models/dependency-graph';
import { AwsServiceRegistry, registryWrapper } from './aws-service-registry';

export async function registerServices({ aws, dependencyGraph }: { aws: any; dependencyGraph: DependencyGraph }) {
  // For each tests dir, look under support/aws/services and register any services if they export
  // 'registerServices()' function. Note: these are not the solution services. Services here are
  // just classes that we use to access AWS services and have nothing to do with services container and
  // services in the solution.

  const registry = new AwsServiceRegistry();

  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const dir = path.join(testsDir, 'support/aws/services');

    // invokeMethodInDir knows how to find the files and the method
    await invokeMethodInDir({ dir, methodName: 'registerServices' }, async (file, method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerServices() exported by the js file
      return method({ aws, registry: wrapper });
    });
  }

  // Now that we have all the services registered in the registry, we need to go through
  // the registry to prepare them
  const services = await prepareServices({ aws, registry });

  return { registry, services };
}

// Returns ready to use aws services
async function prepareServices({ aws, registry }) {
  const result = {};
  const services = registry.entries();

  _.forEach(services, (awsServiceClass, awsServiceName) => {
    // This allows us to obtain a specific aws sdk by assuming the given role
    // For the tests perspective, they have access to the service as follows (example):
    // const cloudformation = await aws.service.cloudformation();
    // or if they want to use a specific role, the tests can do this (example):
    // const cloudformation = await aws.services.cloudformation({}, roleInfo);
    result[awsServiceName] = async (options = {}, roleInfo = {}) =>
      getInstance(awsServiceClass, { aws }, options, roleInfo);
  });

  return result;
}

/**
 * The function assumes the specified role and constructs an instance of the specified AWS client SDK with the
 * temporary credentials obtained by assuming the role.
 *
 * @param assumeRoleInfo.roleArn The ARN of the role to assume
 * @param assumeRoleInfo.roleSessionName Optional name of the role session (defaults to <envName>-<current epoch time>)
 * @param assumeRoleInfo.externalId Optional external id to use for assuming the role.
 * @param clientName Name of the client SDK to create (E.g., S3, SageMaker, ServiceCatalog etc)
 * @param options Optional options object to pass to the client SDK (E.g., { apiVersion: '2011-06-15' })
 * @returns {Promise<*>}
 */
async function getSdk({ aws, clientName }, options = {}, assumeRoleInfo = {}) {
  if (_.isEmpty(assumeRoleInfo)) {
    return new aws.sdk[clientName](options);
  }
  return aws.getClientSdkForRole({ ...assumeRoleInfo, clientName, options });
}

async function getInstance(ConstructorClass, { aws }, options = {}, assumeRoleInfo = {}) {
  const sdk = await getSdk({ aws, clientName: ConstructorClass.clientName }, options, assumeRoleInfo);
  const instance = new ConstructorClass({ aws, sdk });

  if (_.isFunction(instance.init)) {
    await instance.init();
  }

  return instance;
}
