import { Global, Module, Provider } from '@nestjs/common';
import { configEnvLoader } from '@aws-ee/common';
import { ConfigModule } from '@nestjs/config';

import { EventbridgeConfig } from '../config/eventbridge-config';
import { EventbridgeService } from '../services/eventbridge.service';

const providers: Provider[] = [EventbridgeService];

@Global()
@Module({
  imports: [ConfigModule.forFeature(configEnvLoader(EventbridgeConfig))],
  providers,
  exports: providers,
})
export class EventbridgeModule {}
