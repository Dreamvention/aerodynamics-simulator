import { Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelRepository, ModelService, S3Gateway } from './data';

@Module({
  providers: [ModelService, ModelRepository, S3Gateway],
  controllers: [ModelController],
  exports: [ModelService],
})
export class ModelModule {}
