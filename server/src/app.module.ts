import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MlClassifierModule } from './ml-classifier/ml-classifier.module';

@Module({
  imports: [MlClassifierModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
