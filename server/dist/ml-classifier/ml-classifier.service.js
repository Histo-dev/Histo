"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var MlClassifierService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MlClassifierService = void 0;
const common_1 = require("@nestjs/common");
const use = __importStar(require("@tensorflow-models/universal-sentence-encoder"));
let MlClassifierService = MlClassifierService_1 = class MlClassifierService {
    constructor() {
        this.logger = new common_1.Logger(MlClassifierService_1.name);
        this.model = null;
        this.categoryEmbeddings = [];
        this.isModelLoaded = false;
    }
    async onModuleInit() {
        await this.loadModel();
    }
    /**
     * Universal Sentence Encoder 모델 로딩
     */
    async loadModel() {
        try {
            this.logger.log('Loading Universal Sentence Encoder model...');
            this.model = await use.load();
            this.isModelLoaded = true;
            this.logger.log('Model loaded successfully');
        }
        catch (error) {
            this.logger.error('Failed to load model', error);
            throw error;
        }
    }
    /**
     * 텍스트를 임베딩 벡터로 변환
     */
    async embed(text) {
        if (!this.isModelLoaded || !this.model) {
            throw new Error('Model is not loaded yet');
        }
        try {
            const embeddings = await this.model.embed([text]);
            const embeddingArray = await embeddings.array();
            embeddings.dispose(); // 메모리 해제
            if (!embeddingArray[0]) {
                throw new Error('Failed to generate embedding');
            }
            return embeddingArray[0];
        }
        catch (error) {
            this.logger.error(`Failed to embed text: ${text}`, error);
            throw error;
        }
    }
    /**
     * 여러 텍스트를 한번에 임베딩 (배치 처리)
     */
    async embedBatch(texts) {
        if (!this.isModelLoaded || !this.model) {
            throw new Error('Model is not loaded yet');
        }
        try {
            const embeddings = await this.model.embed(texts);
            const embeddingArray = await embeddings.array();
            embeddings.dispose(); // 메모리 해제
            return embeddingArray;
        }
        catch (error) {
            this.logger.error('Failed to embed batch texts', error);
            throw error;
        }
    }
    /**
     * 두 벡터 간 코사인 유사도 계산
     */
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    /**
     * 카테고리 임베딩 설정 (초기화 또는 업데이트 시 사용)
     */
    setCategoryEmbeddings(categories) {
        this.categoryEmbeddings = categories;
        this.logger.log(`Category embeddings set: ${categories.length} categories`);
    }
    /**
     * 카테고리 대표 텍스트로부터 임베딩 생성 및 저장
     */
    async initializeCategoryEmbeddings(categories) {
        this.logger.log('Initializing category embeddings...');
        const categoryEmbeddings = [];
        for (const category of categories) {
            // 대표 텍스트들의 평균 임베딩 계산
            const embeddings = await this.embedBatch(category.representativeTexts);
            const avgEmbedding = this.averageEmbeddings(embeddings);
            categoryEmbeddings.push({
                id: category.id,
                name: category.name,
                embedding: avgEmbedding,
            });
        }
        this.setCategoryEmbeddings(categoryEmbeddings);
    }
    /**
     * 여러 임베딩의 평균 계산
     */
    averageEmbeddings(embeddings) {
        if (!embeddings[0]) {
            throw new Error('No embeddings provided');
        }
        const embeddingLength = embeddings[0].length;
        const avgEmbedding = new Array(embeddingLength).fill(0);
        for (const embedding of embeddings) {
            for (let i = 0; i < embeddingLength; i++) {
                avgEmbedding[i] += embedding[i];
            }
        }
        for (let i = 0; i < embeddingLength; i++) {
            avgEmbedding[i] /= embeddings.length;
        }
        return avgEmbedding;
    }
    /**
     * 텍스트를 카테고리로 분류
     */
    async classify(text, threshold = 0.5) {
        if (this.categoryEmbeddings.length === 0) {
            throw new Error('Category embeddings not initialized');
        }
        const textEmbedding = await this.embed(text);
        let maxSimilarity = -1;
        let bestCategory = null;
        for (const category of this.categoryEmbeddings) {
            const similarity = this.cosineSimilarity(textEmbedding, category.embedding);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestCategory = category;
            }
        }
        // 임계값 이하면 null 반환 (분류 불가)
        if (maxSimilarity < threshold || !bestCategory) {
            return null;
        }
        return {
            categoryId: bestCategory.id,
            categoryName: bestCategory.name,
            confidence: maxSimilarity,
        };
    }
    /**
     * 배치로 여러 텍스트 분류
     */
    async classifyBatch(texts, threshold = 0.5) {
        const textEmbeddings = await this.embedBatch(texts);
        return textEmbeddings.map((textEmbedding) => {
            let maxSimilarity = -1;
            let bestCategory = null;
            for (const category of this.categoryEmbeddings) {
                const similarity = this.cosineSimilarity(textEmbedding, category.embedding);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestCategory = category;
                }
            }
            if (maxSimilarity < threshold || !bestCategory) {
                return null;
            }
            return {
                categoryId: bestCategory.id,
                categoryName: bestCategory.name,
                confidence: maxSimilarity,
            };
        });
    }
    /**
     * 모델 로딩 상태 확인
     */
    isReady() {
        return this.isModelLoaded;
    }
};
exports.MlClassifierService = MlClassifierService;
exports.MlClassifierService = MlClassifierService = MlClassifierService_1 = __decorate([
    (0, common_1.Injectable)()
], MlClassifierService);
//# sourceMappingURL=ml-classifier.service.js.map