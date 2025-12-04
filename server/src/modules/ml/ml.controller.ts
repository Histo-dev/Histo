import { Controller, Post, Body, Get } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { ClassifyPageDto } from './dto/classify-page.dto';
import { BatchClassifyDto } from './dto/batch-classify.dto';

@Controller('ml')
export class MlController {
  constructor(private readonly classificationService: ClassificationService) {}

  /**
   * 단일 페이지 분류
   */
  @Post('classify')
  async classifyPage(@Body() dto: ClassifyPageDto) {
    return await this.classificationService.classifyPage({
      url: dto.url,
      title: dto.title,
      meta: dto.meta,
    });
  }

  /**
   * 여러 페이지 일괄 분류
   */
  @Post('classify/batch')
  async classifyPages(@Body() dto: BatchClassifyDto) {
    const pages = dto.pages.map((page) => ({
      url: page.url,
      title: page.title,
      meta: page.meta,
    }));

    return await this.classificationService.classifyPages(pages);
  }

  /**
   * 카테고리 임베딩 새로고침
   */
  @Post('refresh-embeddings')
  async refreshEmbeddings() {
    await this.classificationService.refreshCategoryEmbeddings();
    return { message: 'Category embeddings refreshed successfully' };
  }

  /**
   * 헬스체크
   */
  @Get('health')
  health() {
    return { status: 'ok', message: 'ML service is running' };
  }
}