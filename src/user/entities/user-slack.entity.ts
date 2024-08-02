import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

// src/user/entities/user-slack.entity.ts
@Entity('UserSlack')
export class UserSlack {
  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  slackId: string;

  @Column()
  teamId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  realName?: string;

  @Column()
  isCustomImage: boolean;

  @Column()
  image24?: string;

  @Column()
  image32?: string;

  @Column()
  image48?: string;

  @Column()
  image72?: string;

  @Column()
  image192?: string;

  @Column()
  image512?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
