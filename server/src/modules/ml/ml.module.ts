import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ClassificationService } from './classification.service';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [CategoryModule],
  providers: [EmbeddingService, ClassificationService],
  exports: [ClassificationService],
})
export class MlModule {}