import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCategoryAlert } from '../../entities/user-category-alert.entity';
import { UserDomainAlert } from '../../entities/user-domain-alert.entity';
import { AlertService } from './alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserCategoryAlert, UserDomainAlert])],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}