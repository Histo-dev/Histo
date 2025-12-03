import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category } from '../entities';
import { MlClassifierService } from '../ml-classifier/ml-classifier.service';
export declare class SeedService implements OnModuleInit {
    private readonly categoryRepository;
    private readonly mlClassifierService;
    private readonly logger;
    constructor(categoryRepository: Repository<Category>, mlClassifierService: MlClassifierService);
    onModuleInit(): Promise<void>;
    /**
     * 기본 카테고리 데이터 시드
     */
    private seedCategories;
    /**
     * ML 분류기 카테고리 임베딩 초기화
     */
    private initializeMlCategories;
}
//# sourceMappingURL=seed.service.d.ts.map