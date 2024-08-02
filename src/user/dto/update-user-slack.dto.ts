// src/user/dto/update-user-slack.dto.ts
export class UpdateUserSlackDto {
  userId?: string;
  slackId?: string;
  teamId?: string;
  name?: string;
  email?: string;
  realName?: string;
  isCustomImage?: boolean;
  image24?: string;
  image32?: string;
  image48?: string;
  image72?: string;
  image192?: string;
  image512?: string;
  updatedAt: Date;
}
