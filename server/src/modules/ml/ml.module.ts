import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ClassificationService } from './classification.service';
import { MlController } from './ml.controller';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [CategoryModule],
  controllers: [MlController],
  providers: [EmbeddingService, ClassificationService],
  exports: [ClassificationService],
})
export class MlModule {}