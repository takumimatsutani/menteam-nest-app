import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsString()
  userId: string;

  @IsString()
  password?: string;

  @IsArray()
  @ArrayNotEmpty()
  roleIds: string[];
}
