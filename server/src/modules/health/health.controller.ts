import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      services: {
        database: 'connected',
        ml: 'loaded',
      },
    };
  }
}