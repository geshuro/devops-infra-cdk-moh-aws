If your solution introduces new REST resources, this folder is where you can introduce
new "resource nodes", complex clean up logic, etc.

However, the actual tests should stay under the `__tests__` folder and not in this folder.

The following is a list of all the configurations by conventions available while you write
your solution tests (all optional):


 Feature | Expected Path | Expected Function
----|-----|-----|
Init (bootstrap) | support/init.ts | async init({ settings, aws, dependencyGraph })
Generators | support/generators.ts | async registerGenerators({ setup, registry })
Defaults | support/defaults.ts | async registerDefaults({ setup, registry })
Resource Nodes | support/resources/* | async registerResources({ clientSession, registry })
Tables | support/aws/tables.ts | async tableNames()
Services | support/aws/services/*  | async registerServices({ aws, registry  })