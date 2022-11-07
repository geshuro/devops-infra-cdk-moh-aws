# Installation steps

1. Add this package as a dependency to the top level infra package (usually `@aws-ee/infrastructure` under `main/infra`)
```json
{
    "dependencies": {
        "@aws-ee/monitoring-infra": "workspace:*",
    }
}
```

2. Add the `MonitoringInfraModule` to the `InfrastructureModule`
```ts
//...
import { MonitoringInfraModule } from '@aws-ee/monitoring-infra'

@Global()
@Module({
  imports: [
    // ...
    MonitoringInfraModule
  ],
})
export class InfrastructureModule {}

```