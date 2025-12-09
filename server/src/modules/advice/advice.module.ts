import { Module } from '@nestjs/common';
import { AdviceService } from './advice.service';
import { AdviceController } from './advice.controller';
import { GeminiService } from './gemini.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [HistoryModule],
  controllers: [AdviceController],
  providers: [AdviceService, GeminiService],
  exports: [AdviceService],
})
export class AdviceModule {}