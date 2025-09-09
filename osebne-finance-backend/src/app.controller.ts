import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() getHello() {
    return 'Živjo iz Dockerja!';
  }
    @Get('health') health(){ return { status: 'ok', time: new Date().toISOString() }; }
}
