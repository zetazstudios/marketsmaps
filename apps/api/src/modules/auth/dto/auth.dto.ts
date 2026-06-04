import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['personal', 'artesano', 'creador_digital', 'comercial'])
  userType?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
