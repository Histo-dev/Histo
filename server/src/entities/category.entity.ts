import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { History } from './history.entity';
import { UserCategoryAlert } from './user-category-alert.entity';

@Entity('Category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  // ML용 임베딩 벡터 (JSON string으로 저장)
  @Column({ type: 'text', nullable: true })
  embedding: string;

  @Column({ type: 'int' })
  dimension: number;

  // Relations
  @OneToMany(() => History, (history) => history.category)
  histories: History[];

  @OneToMany(() => UserCategoryAlert, (userCategoryAlert) => userCategoryAlert.category)
  userCategoryAlerts: UserCategoryAlert[];
}