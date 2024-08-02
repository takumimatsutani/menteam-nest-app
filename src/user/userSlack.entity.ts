// userSlack.entity.ts
import * as typeorm from 'typeorm';

@typeorm.Entity()
export class UserSlack {
  @typeorm.PrimaryGeneratedColumn()
  id: string;

  @typeorm.Column()
  userId: string;

  @typeorm.Column()
  slackId: string;

  @typeorm.Column()
  teamId: string;

  @typeorm.Column()
  name: string;

  @typeorm.Column()
  email: string;

  @typeorm.Column()
  realName: string;

  @typeorm.Column()
  isCustomImage: boolean;

  @typeorm.Column({ nullable: true })
  image24: string;

  @typeorm.Column({ nullable: true })
  image32: string;

  @typeorm.Column({ nullable: true })
  image48: string;

  @typeorm.Column({ nullable: true })
  image72: string;

  @typeorm.Column({ nullable: true })
  image192: string;

  @typeorm.Column({ nullable: true })
  image512: string;

  @typeorm.DeleteDateColumn()
  deletedAt: Date;
}
