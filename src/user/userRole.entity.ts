// userRole.entity.ts
import * as typeorm from 'typeorm';

@typeorm.Entity()
export class UserRole {
  @typeorm.PrimaryGeneratedColumn()
  id: string;

  @typeorm.Column()
  userId: string;

  @typeorm.Column()
  roleId: number;

  @typeorm.DeleteDateColumn()
  deletedAt: Date;
}
