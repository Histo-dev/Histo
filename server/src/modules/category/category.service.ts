import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // 중복 확인
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(`Category '${createCategoryDto.name}' already exists`);
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      relations: ['histories'],
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      embedding: category.embedding,
      historyCount: category.histories?.length || 0,
    }));
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['histories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { name },
    });
  }

  async update(id: string, updateData: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.findOne(id);
    
    Object.assign(category, updateData);
    
    return await this.categoryRepository.save(category);
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<Category> {
    const category = await this.findOne(id);
    category.embedding = JSON.stringify(embedding);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async count(): Promise<number> {
    return await this.categoryRepository.count();
  }
}