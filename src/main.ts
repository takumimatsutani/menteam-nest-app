import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './core/status_response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const host = configService.get<string>('HOST') || 'localhost';
  const port = configService.get<number>('PORT') || 8000;

  app.useGlobalFilters(new AllExceptionsFilter()); // グローバルエラーハンドラー

  // CORS設定
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  if (corsOrigins) {
    app.enableCors({
      origin: JSON.parse(corsOrigins).ORIGINS,
      credentials: true,
      optionsSuccessStatus: 200,
    });
  }

  await app.listen(port, host);
  Logger.log(`App listen on ${host}:${port}`, 'Bootstrap');
}
bootstrap();
