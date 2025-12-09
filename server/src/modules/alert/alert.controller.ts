import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlertService } from './alert.service';
import { CreateUserCategoryAlertDto } from './dto/create-user-category-alert.dto';
import { CreateUserDomainAlertDto } from './dto/create-user-domain-alert.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Alert')
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // ========== 카테고리 알림 ==========

  @Post('category')
  @HttpCode(HttpStatus.CREATED)
  async createCategoryAlert(@Body() dto: CreateUserCategoryAlertDto) {
    return await this.alertService.createCategoryAlert(dto);
  }

  @Get('category')
  async getCategoryAlerts(@CurrentUser() currentUser: CurrentUserData) {
    return await this.alertService.getCategoryAlerts(currentUser.id);
  }

  @Put('category/:categoryId')
  async updateCategoryAlert(
    @Param('categoryId') id: string,
    @Body('alertTime') alertTime: number,
  ) {
    return await this.alertService.updateCategoryAlert(id, alertTime);
  }

  @Delete('category/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategoryAlert(@Param('categoryId') id: string) {
    await this.alertService.deleteCategoryAlert(id);
  }

  // ========== 도메인 알림 ==========

  @Post('domain')
  @HttpCode(HttpStatus.CREATED)
  async createDomainAlert(@Body() dto: CreateUserDomainAlertDto) {
    return await this.alertService.createDomainAlert(dto);
  }

  @Get('domain')
  async getDomainAlerts(@CurrentUser() currentUser: CurrentUserData) {
    return await this.alertService.getDomainAlerts(currentUser.id);
  }

  @Put('domain/:domainId')
  async updateDomainAlert(
    @Param('domainId') id: string,
    @Body('alertTime') alertTime: number,
  ) {
    return await this.alertService.updateDomainAlert(id, alertTime);
  }

  @Delete('domain/:domainId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDomainAlert(@Param('domainId') id: string) {
    await this.alertService.deleteDomainAlert(id);
  }

  // ========== 알림 체크 ==========

  @Get('check/category')
  async checkCategoryAlert(
    @CurrentUser() currentUser: CurrentUserData,
    @Query('categoryId') categoryId: string,
    @Query('currentTime') currentTime: number,
  ) {
    return await this.alertService.checkCategoryAlert(
      currentUser.id,
      categoryId,
      Number(currentTime),
    );
  }

  @Get('check/domain')
  async checkDomainAlert(
    @CurrentUser() currentUser: CurrentUserData,
    @Query('host') host: string,
    @Query('currentTime') currentTime: number,
  ) {
    return await this.alertService.checkDomainAlert(
      currentUser.id,
      host,
      Number(currentTime),
    );
  }
}