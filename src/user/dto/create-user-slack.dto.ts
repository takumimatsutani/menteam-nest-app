// src/user/dto/create-user-slack.dto.ts
export class CreateUserSlackDto {
  userId: string;
  slackId: string;
  teamId: string;
  name: string;
  email: string;
  realName?: string;
  isCustomImage: boolean;
  image24?: string;
  image32?: string;
  image48?: string;
  image72?: string;
  image192?: string;
  image512?: string;
  createdAt: Date;
  updatedAt: Date;
}
