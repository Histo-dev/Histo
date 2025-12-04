import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCategory } from '../../entities/user-category.entity';
import { UserDomainAlert } from '../../entities/user-domain-alert.entity';
import { CreateUserCategoryAlertDto } from './dto/create-user-category-alert.dto';
import { CreateUserDomainAlertDto } from './dto/create-user-domain-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(UserCategory)
    private readonly userCategoryRepository: Repository<UserCategory>,
    @InjectRepository(UserDomainAlert)
    private readonly userDomainAlertRepository: Repository<UserDomainAlert>,
  ) {}

  // ========== 카테고리 알림 ==========

  async createCategoryAlert(dto: CreateUserCategoryAlertDto): Promise<UserCategory> {
    const alert = this.userCategoryRepository.create(dto);
    return await this.userCategoryRepository.save(alert);
  }

  async getCategoryAlerts(userId: string): Promise<UserCategory[]> {
    return await this.userCategoryRepository.find({
      where: { userId },
      relations: ['category', 'user'],
    });
  }

  async updateCategoryAlert(
    id: string,
    alertTime: number,
  ): Promise<UserCategory> {
    const alert = await this.userCategoryRepository.findOne({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Category alert with ID '${id}' not found`);
    }

    alert.alertTime = alertTime;
    return await this.userCategoryRepository.save(alert);
  }

  async deleteCategoryAlert(id: string): Promise<void> {
    const alert = await this.userCategoryRepository.findOne({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Category alert with ID '${id}' not found`);
    }

    await this.userCategoryRepository.remove(alert);
  }

  // ========== 도메인 알림 ==========

  async createDomainAlert(dto: CreateUserDomainAlertDto): Promise<UserDomainAlert> {
    const alert = this.userDomainAlertRepository.create(dto);
    return await this.userDomainAlertRepository.save(alert);
  }

  async getDomainAlerts(userId: string): Promise<UserDomainAlert[]> {
    return await this.userDomainAlertRepository.find({
      where: { userId },
      relations: ['user'],
    });
  }

  async updateDomainAlert(
    id: string,
    alertTime: number,
  ): Promise<UserDomainAlert> {
    const alert = await this.userDomainAlertRepository.findOne({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Domain alert with ID '${id}' not found`);
    }

    alert.alertTime = alertTime;
    return await this.userDomainAlertRepository.save(alert);
  }

  async deleteDomainAlert(id: string): Promise<void> {
    const alert = await this.userDomainAlertRepository.findOne({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Domain alert with ID '${id}' not found`);
    }

    await this.userDomainAlertRepository.remove(alert);
  }

  // ========== 알림 체크 로직 ==========

  /**
   * 특정 카테고리 사용 시간이 알림 시간을 초과했는지 체크
   */
  async checkCategoryAlert(
    userId: string,
    categoryId: string,
    currentTime: number, // 현재 카테고리 사용 시간 (분)
  ): Promise<{ shouldAlert: boolean; alertTime: number }> {
    const alert = await this.userCategoryRepository.findOne({
      where: { userId, categoryId },
    });

    if (!alert) {
      return { shouldAlert: false, alertTime: 0 };
    }

    return {
      shouldAlert: currentTime >= alert.alertTime,
      alertTime: alert.alertTime,
    };
  }

  /**
   * 특정 도메인 사용 시간이 알림 시간을 초과했는지 체크
   */
  async checkDomainAlert(
    userId: string,
    host: string,
    currentTime: number, // 현재 도메인 사용 시간 (분)
  ): Promise<{ shouldAlert: boolean; alertTime: number }> {
    const alert = await this.userDomainAlertRepository.findOne({
      where: { userId, host },
    });

    if (!alert) {
      return { shouldAlert: false, alertTime: 0 };
    }

    return {
      shouldAlert: currentTime >= alert.alertTime,
      alertTime: alert.alertTime,
    };
  }
}