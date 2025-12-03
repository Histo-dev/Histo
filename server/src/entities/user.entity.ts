import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
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

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => History, (history) => history.user)
  histories: History[];

  @OneToMany(() => UserCategory, (userCategory) => userCategory.user)
  userCategories: UserCategory[];

  @OneToMany(() => UserDomainAlert, (userDomainAlert) => userDomainAlert.user)
  userDomainAlerts: UserDomainAlert[];
}
