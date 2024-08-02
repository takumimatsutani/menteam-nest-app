import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  password: string;
}
