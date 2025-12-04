import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from '../../entities/history.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { MlModule } from '../ml/ml.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([History]),
    MlModule, // ML 분류 서비스 사용
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}