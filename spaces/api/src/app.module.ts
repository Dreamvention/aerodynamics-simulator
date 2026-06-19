import { Module } from '@nestjs/common';
import { AeroController } from './controllers/aero';
import { AeroService } from './services/aero';

@Module({
  controllers: [AeroController],
  providers: [AeroService],
})
export class AppModule {}