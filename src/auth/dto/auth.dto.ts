// login.dto.ts
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  userId: string;

  @IsString()
  password: string;
}
