import { Controller, Get } from '@nestjs/common';
import { HealthService } from './data';
import { HealthResponseDto } from './dtos';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthResponseDto {
    return this.healthService.getStatus();
  }
}
