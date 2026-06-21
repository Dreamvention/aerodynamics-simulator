import { Module } from '@nestjs/common';
import { HealthService } from './data';
import { HealthController } from './health.controller';

@Module({
  providers: [HealthService],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}
