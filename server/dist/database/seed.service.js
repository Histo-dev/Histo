"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const ml_classifier_config_1 = require("../ml-classifier/ml-classifier.config");
const ml_classifier_service_1 = require("../ml-classifier/ml-classifier.service");
let SeedService = SeedService_1 = class SeedService {
    constructor(categoryRepository, mlClassifierService) {
        this.categoryRepository = categoryRepository;
        this.mlClassifierService = mlClassifierService;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async onModuleInit() {
        await this.seedCategories();
        await this.initializeMlCategories();
    }
    /**
     * 기본 카테고리 데이터 시드
     */
    async seedCategories() {
        this.logger.log('Checking if categories need to be seeded...');
        const existingCategories = await this.categoryRepository.find();
        if (existingCategories.length > 0) {
            this.logger.log(`Categories already exist (${existingCategories.length} found), skipping seed.`);
            return;
        }
        this.logger.log('Seeding categories...');
        const categories = ml_classifier_config_1.DEFAULT_CATEGORIES.map((cat) => {
            const category = new entities_1.Category();
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
    async initializeMlCategories() {
        this.logger.log('Initializing ML classifier category embeddings...');
        try {
            // ML 모델이 로드될 때까지 대기
            if (!this.mlClassifierService.isReady()) {
                this.logger.log('Waiting for ML model to load...');
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            await this.mlClassifierService.initializeCategoryEmbeddings(ml_classifier_config_1.DEFAULT_CATEGORIES);
            this.logger.log('ML classifier category embeddings initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize ML category embeddings', error);
            throw error;
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ml_classifier_service_1.MlClassifierService])
], SeedService);
//# sourceMappingURL=seed.service.js.map