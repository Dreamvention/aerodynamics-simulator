import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@slices/health/health.module';
import { ModelModule } from '@slices/model/model.module';
import { AerodynamicModule } from '@slices/aerodynamic/aerodynamic.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,
    ModelModule,
    AerodynamicModule,
  ],
})
export class AppModule {}
