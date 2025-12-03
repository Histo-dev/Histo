import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MlClassifierModule } from './ml-classifier/ml-classifier.module';
import { DatabaseModule } from './database/database.module';
import { User, Category, History, UserCategory, UserDomainAlert } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'histo.db',
      entities: [User, Category, History, UserCategory, UserDomainAlert],
      synchronize: true, // 개발 환경에서만 true (프로덕션에서는 false)
      logging: true,
    }),
    MlClassifierModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
