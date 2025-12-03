import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, History, User, UserCategory, UserDomainAlert } from '../entities';
import { MlClassifierModule } from '../ml-classifier/ml-classifier.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, History, User, UserCategory, UserDomainAlert]),
    MlClassifierModule,
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
