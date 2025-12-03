import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('User_Category')
export class UserCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'category_id' })
  categoryId: string;

  @Column({ type: 'integer', name: 'alert_time' })
  alertTime: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userCategories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.userCategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
