import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`[server] listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
