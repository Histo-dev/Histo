import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { CategoryModule } from '../../modules/category/category.module';

@Module({
  imports: [CategoryModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}