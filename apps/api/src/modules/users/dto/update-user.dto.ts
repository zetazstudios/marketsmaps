import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, any>;

  // Artesano specific fields
  @IsString()
  @IsOptional()
  story?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  processImages?: string[];

  // Privacy options
  @IsEnum(['exact', 'approximate', 'city', 'invisible'])
  @IsOptional()
  locationPrivacy?: string;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}
