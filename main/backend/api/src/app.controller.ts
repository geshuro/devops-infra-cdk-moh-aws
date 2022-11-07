import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/api/hello')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    return this.appService.getHelloMessages();
  }
}
