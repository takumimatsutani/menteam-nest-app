// src/user/dto/create-user-role.dto.ts
export class CreateUserRoleDto {
  userId: string;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
