import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS 설정 - 개발 환경에서는 모든 origin 허용
  app.enableCors({
    origin: true, // 모든 origin 허용 (개발용)
    credentials: true,
  });

  // Swagger 문서화
  const config = new DocumentBuilder()
    .setTitle('HISTO API')
    .setDescription('히스토리 분석 및 관리 API 문서')
    .setVersion('1.0')
    .addTag('User', '사용자 관리')
    .addTag('Category', '카테고리 관리')
    .addTag('History', '히스토리 관리 및 통계')
    .addTag('Advice', '조언 생성')
    .addTag('Health', '서버 상태 확인')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  const port = configService.get<number>("PORT", 3000);
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   HISTO API Server                                    ║
║                                                       ║
║   Server:    http://localhost:${port}                    ║
║   API Docs:  http://localhost:${port}/api-docs           ║
║   Env:       ${configService.get<string>(
    "NODE_ENV"
  )}                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
