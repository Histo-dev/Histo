import { Module } from '@nestjs/common';
import { MlClassifierService } from './ml-classifier.service';

@Module({
  providers: [MlClassifierService],
  exports: [MlClassifierService],
})
export class MlClassifierModule {}
