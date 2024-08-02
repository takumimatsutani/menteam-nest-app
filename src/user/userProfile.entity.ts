// userProfile.entity.ts
import * as typeorm from 'typeorm';

@typeorm.Entity()
export class UserProfile {
  @typeorm.PrimaryGeneratedColumn()
  id: string;

  @typeorm.Column()
  userId: string;

  @typeorm.Column({ nullable: true })
  displayName: string;

  @typeorm.Column({ nullable: true })
  image: string;

  @typeorm.DeleteDateColumn()
  deletedAt: Date;
}
