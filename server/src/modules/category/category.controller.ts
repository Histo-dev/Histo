import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '카테고리 목록 조회', description: '모든 카테고리 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공', type: [CategoryResponseDto] })
  async findAll(): Promise<CategoryResponseDto[]> {
    return await this.categoryService.findAll();
  }
}