import _ from 'lodash';
import path from 'path';

import { invokeMethodInFile } from '../helpers/invoke-method';
import { Registry } from '../helpers/registry';
import { Table } from './table';

/**
 * For each tests dir, look for support/aws/tables.ts, if it exists and it exports tableNames() function,
 * then call this method. The tableNames() function is expected to return an array of strings representing the
 * table names.
 *
 * Returns the populated registry and tables which is a map of table names and their Table instances
 */
export async function registerTables({ dynamoDb }) {
  const aws = dynamoDb.aws;
  const { dependencyGraph } = aws;
  const registry = new Registry();
  // For each tests dir, look for support/aws/tables.ts, if it exists and if it exports
  // 'tableNames()' function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/aws/tables.ts');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'tableNames' }, async (method) => {
      const source = { name: node.name, file };

      // Call the tableNames() exported by the tables.ts file
      const tableNames = await method();

      // We register the table names in the registry
      registry.merge(_.keyBy(tableNames), source);
    });
  }

  const tableEntries = _.keys(registry.entries());
  const tables = {};

  // We create a Table instance per table name
  _.forEach(tableEntries, (name) => {
    tables[name] = new Table({ dynamoDb, name });
  });

  return { registry, tables };
}
