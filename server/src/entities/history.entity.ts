import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('History')
@Index(['userId', 'visitedAt']) // 사용자별 시간순 조회 최적화
@Index(['categoryId', 'visitedAt']) // 카테고리별 통계 조회 최적화
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  meta: string;

  @Column({ name: 'use_time', type: 'integer', default: 0 })
  useTime: number; // 체류 시간 (초 단위)

  @Column({ name: 'visited_at', type: 'timestamp' })
  visitedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.histories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.histories, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // 도메인 추출용 getter
  get domain(): string {
    try {
      return new URL(this.url).hostname;
    } catch {
      return '';
    }
  }
}