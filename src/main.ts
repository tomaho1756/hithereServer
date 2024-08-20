import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import * as https from 'https';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./server.key.new'),
    cert: readFileSync('./server.crt'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['content-type'],
  });

  await app.listen(3000, '0.0.0.0');
  console.log('Server running on https://localhost:3000');
}
bootstrap();
