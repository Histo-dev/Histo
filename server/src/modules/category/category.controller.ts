import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async findAll(): Promise<CategoryResponseDto[]> {
    return await this.categoryService.findAll();
  }
  
  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.categoryService.findOne(id);
  }
}