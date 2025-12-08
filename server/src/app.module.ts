import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { CategoryModule } from './modules/category/category.module';
import { SeederModule } from './common/seeder/seeder.module';
import { MlModule } from './modules/ml/ml.module';
import { HistoryModule } from './modules/history/history.module';
import { UserModule } from './modules/user/user.module';
import { AlertModule } from './modules/alert/alert.module';
import { AdviceModule } from './modules/advice/advice.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // 환경변수 설정 (검증 포함)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    
    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    HealthModule,
    UserModule,
    CategoryModule,
    HistoryModule,
    MlModule,
    AlertModule,
    AdviceModule,
    SeederModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}