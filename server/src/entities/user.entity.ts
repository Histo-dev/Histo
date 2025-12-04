import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { History } from './history.entity';
import { UserCategory } from './user-category.entity';
import { UserDomainAlert } from './user-domain-alert.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => History, (history) => history.user)
  histories: History[];

  @OneToMany(() => UserCategory, (userCategory) => userCategory.user)
  userCategories: UserCategory[];

  @OneToMany(() => UserDomainAlert, (alert) => alert.user)
  domainAlerts: UserDomainAlert[];
}