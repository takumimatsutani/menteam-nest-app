// src/user/dto/create-user-profile.dto.ts
export class CreateUserProfileDto {
  userId: string;
  displayName?: string;
  profile?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
