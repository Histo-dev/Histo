import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoryService } from '../../modules/category/category.service';

interface DefaultCategory {
  name: string;
  description: string;
}

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  // 기본 카테고리 정의
  private readonly defaultCategories: DefaultCategory[] = [
    {
      name: '업무',
      description: '업무 관련 사이트 (이메일, 문서 작업, 회의 등)',
    },
    {
      name: '학습',
      description: '학습 관련 사이트 (강의, 튜토리얼, 문서, 논문 등)',
    },
    {
      name: '개발',
      description: '개발 관련 사이트 (GitHub, Stack Overflow, 개발 문서 등)',
    },
    {
      name: '엔터테인먼트',
      description: '엔터테인먼트 사이트 (영상, 음악, 게임 등)',
    },
    {
      name: '소셜미디어',
      description: '소셜 미디어 및 커뮤니티 (SNS, 포럼, 블로그 등)',
    },
    {
      name: '쇼핑',
      description: '쇼핑 및 전자상거래 사이트',
    },
    {
      name: '뉴스',
      description: '뉴스 및 정보 사이트',
    },
    {
      name: '기타',
      description: '분류되지 않은 기타 사이트',
    },
  ];

  constructor(
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // 개발 환경에서만 자동 시딩
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      await this.seed();
    }
  }

  async seed(): Promise<void> {
    try {
      const count = await this.categoryService.count();

      if (count > 0) {
        this.logger.log('Categories already seeded. Skipping...');
        return;
      }

      this.logger.log('Seeding default categories...');

      for (const categoryData of this.defaultCategories) {
        try {
          await this.categoryService.create(categoryData);
          this.logger.log(`✓ Created category: ${categoryData.name}`);
        } catch (error) {
          this.logger.warn(`✗ Failed to create category: ${categoryData.name}`);
        }
      }

      this.logger.log('✅ Category seeding completed!');
    } catch (error) {
      this.logger.error('Failed to seed categories:', error);
    }
  }

  // 수동 시딩을 위한 메서드
  async reseed(): Promise<void> {
    this.logger.log('Re-seeding categories...');
    
    // 기존 카테고리 삭제는 히스토리 데이터가 있을 수 있으므로 조심스럽게 처리
    const existingCategories = await this.categoryService.findAll();
    
    for (const category of existingCategories) {
      if (category.historyCount === 0) {
        await this.categoryService.remove(category.id);
      }
    }

    await this.seed();
  }
}