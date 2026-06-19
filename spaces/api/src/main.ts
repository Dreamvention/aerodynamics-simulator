import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.creat(AppModule);
  await app.use(cors({ origin: '*' }));
  await app.listen(process.env.PORT || 3001);
  console.log('API running on port 3001');
}

bootstrap().catch(err => console.error(err));