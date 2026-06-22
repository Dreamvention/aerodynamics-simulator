import { Module } from '@nestjs/common';
import { AerodynamicController } from './aerodynamic.controller';
import { AerodynamicService } from './data';

@Module({
  providers: [AerodynamicService],
  controllers: [AerodynamicController],
  exports: [AerodynamicService],
})
export class AerodynamicModule {}
