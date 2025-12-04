import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { History } from './history.entity';
import { UserCategory } from './user-category.entity';

@Entity('Category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ML용 임베딩 벡터 (JSON string으로 저장)
  @Column({ type: 'text', nullable: true })
  embedding: string;

  // Relations
  @OneToMany(() => History, (history) => history.category)
  histories: History[];

  @OneToMany(() => UserCategory, (userCategory) => userCategory.category)
  userCategories: UserCategory[];
}