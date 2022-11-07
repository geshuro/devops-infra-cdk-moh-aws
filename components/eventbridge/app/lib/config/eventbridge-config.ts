import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class EventbridgeConfig {
  static KEY = 'eventbridgeConfig';

  @IsString()
  @Expose({ name: 'APP_SOLUTION_EVENT_BUS_NAME' })
  solutionEventBusName!: string;
}
