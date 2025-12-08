import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoryService } from '../modules/category/category.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('SeedCategoriesScript');

const defaultCategories = [
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

async function bootstrap() {
  logger.log('Starting category seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const categoryService = app.get(CategoryService);

  try {
    // 기존 카테고리 확인
    const count = await categoryService.count();

    if (count > 0) {
      logger.warn(`⚠️  Database already has ${count} categories.`);
      logger.warn('Do you want to continue? This will NOT delete existing categories.');
      logger.warn('Run with --force flag to skip this check.');

      // --force 플래그가 없으면 종료
      if (!process.argv.includes('--force')) {
        logger.log('Exiting. Use --force to continue anyway.');
        await app.close();
        process.exit(0);
      }
    }

    logger.log('Seeding categories...\n');

    for (const categoryData of defaultCategories) {
      try {
        // 이미 존재하는지 확인
        const existing = await categoryService.findByName(categoryData.name);

        if (existing) {
          logger.warn(`⚠️  Category "${categoryData.name}" already exists. Skipping...`);
          continue;
        }

        await categoryService.create(categoryData);
        logger.log(`✅ Created category: ${categoryData.name}`);
      } catch (error) {
        logger.error(`❌ Failed to create category: ${categoryData.name}`, error.message);
      }
    }

    logger.log('\n🎉 Category seeding completed!');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    await app.close();
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
