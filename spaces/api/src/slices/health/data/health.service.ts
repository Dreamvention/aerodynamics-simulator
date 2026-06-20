import { Injectable } from '@nestjs/common';
import { HealthStatus } from '../domain';

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date(),
      version: '1.0.0',
    };
  }
}
