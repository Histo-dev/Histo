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
import { AlertService } from './alert.service';
import { CreateUserCategoryAlertDto } from './dto/create-user-category-alert.dto';
import { CreateUserDomainAlertDto } from './dto/create-user-domain-alert.dto';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // ========== 카테고리 알림 ==========

  @Post('category')
  @HttpCode(HttpStatus.CREATED)
  async createCategoryAlert(@Body() dto: CreateUserCategoryAlertDto) {
    return await this.alertService.createCategoryAlert(dto);
  }

  @Get('category/:userId')
  async getCategoryAlerts(@Param('userId') userId: string) {
    return await this.alertService.getCategoryAlerts(userId);
  }

  @Put('category/:id')
  async updateCategoryAlert(
    @Param('id') id: string,
    @Body('alertTime') alertTime: number,
  ) {
    return await this.alertService.updateCategoryAlert(id, alertTime);
  }

  @Delete('category/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategoryAlert(@Param('id') id: string) {
    await this.alertService.deleteCategoryAlert(id);
  }

  // ========== 도메인 알림 ==========

  @Post('domain')
  @HttpCode(HttpStatus.CREATED)
  async createDomainAlert(@Body() dto: CreateUserDomainAlertDto) {
    return await this.alertService.createDomainAlert(dto);
  }

  @Get('domain/:userId')
  async getDomainAlerts(@Param('userId') userId: string) {
    return await this.alertService.getDomainAlerts(userId);
  }

  @Put('domain/:id')
  async updateDomainAlert(
    @Param('id') id: string,
    @Body('alertTime') alertTime: number,
  ) {
    return await this.alertService.updateDomainAlert(id, alertTime);
  }

  @Delete('domain/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDomainAlert(@Param('id') id: string) {
    await this.alertService.deleteDomainAlert(id);
  }

  // ========== 알림 체크 ==========

  @Get('check/category')
  async checkCategoryAlert(
    @Query('userId') userId: string,
    @Query('categoryId') categoryId: string,
    @Query('currentTime') currentTime: number,
  ) {
    return await this.alertService.checkCategoryAlert(
      userId,
      categoryId,
      Number(currentTime),
    );
  }

  @Get('check/domain')
  async checkDomainAlert(
    @Query('userId') userId: string,
    @Query('host') host: string,
    @Query('currentTime') currentTime: number,
  ) {
    return await this.alertService.checkDomainAlert(
      userId,
      host,
      Number(currentTime),
    );
  }
}