import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('User_Domain_Alert')
export class UserDomainAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  host: string;

  @Column({ type: 'integer', name: 'alert_time' })
  alertTime: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userDomainAlerts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
