import { Module, Global, Provider } from '@nestjs/common';
import { EventbridgeStack } from './eventbridge.stack';

const providers: Provider[] = [EventbridgeStack];

@Global()
@Module({
  providers,
  exports: providers,
})
export class EventbridgeInfraModule {}
