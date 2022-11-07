import { Module } from '@nestjs/common';

import { MonitoringAttacher } from './monitoring.attacher';

const providers = [MonitoringAttacher];

@Module({
  providers,
})
export class MonitoringInfraModule {}
