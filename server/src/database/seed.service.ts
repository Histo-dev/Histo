import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities';
import { DEFAULT_CATEGORIES } from '../ml-classifier/ml-classifier.config';
import { MlClassifierService } from '../ml-classifier/ml-classifier.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly mlClassifierService: MlClassifierService,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.initializeMlCategories();
  }

  /**
   * 기본 카테고리 데이터 시드
   */
  private async seedCategories(): Promise<void> {
    this.logger.log('Checking if categories need to be seeded...');

    const existingCategories = await this.categoryRepository.find();

    if (existingCategories.length > 0) {
      this.logger.log(`Categories already exist (${existingCategories.length} found), skipping seed.`);
      return;
    }

    this.logger.log('Seeding categories...');

    const categories = DEFAULT_CATEGORIES.map((cat) => {
      const category = new Category();
      category.id = cat.id;
      category.name = cat.name;
      return category;
    });

    await this.categoryRepository.save(categories);

    this.logger.log(`Successfully seeded ${categories.length} categories`);
  }

  /**
   * ML 분류기 카테고리 임베딩 초기화
   */
  private async initializeMlCategories(): Promise<void> {
    this.logger.log('Initializing ML classifier category embeddings...');

    try {
      // ML 모델이 로드될 때까지 대기
      if (!this.mlClassifierService.isReady()) {
        this.logger.log('Waiting for ML model to load...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await this.mlClassifierService.initializeCategoryEmbeddings(DEFAULT_CATEGORIES);

      this.logger.log('ML classifier category embeddings initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ML category embeddings', error);
      throw error;
    }
  }
}
