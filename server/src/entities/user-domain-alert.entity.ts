import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('User_Domain_Alert')
export class UserDomainAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  host: string; // 도메인 (예: youtube.com)

  @Column({ name: 'alert_time', type: 'integer' })
  alertTime: number; // 알림 시간 (분 단위)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.domainAlerts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}