import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('History')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meta: string;

  @Column({ type: 'integer', default: 0, name: 'use_time' })
  useTime: number;

  @Column({ type: 'datetime', name: 'visited_at' })
  visitedAt: Date;

  @ManyToOne(() => User, (user) => user.histories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.histories)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
