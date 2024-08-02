// src/user/dto/update-user-profile.dto.ts
export class UpdateUserProfileDto {
  displayName?: string;
  profile?: string;
  image?: string;
  updatedAt: Date;
}
