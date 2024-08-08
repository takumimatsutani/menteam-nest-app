import { IsString, IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class RegisterDto {
  @IsString()
  userId: string;

  @IsString()
  password?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds: number[];
}
