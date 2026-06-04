import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['new', 'used', 'handmade', 'restored'])
  condition?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsString()
  @IsOptional()
  digitalFileUrl?: string;

  @IsString()
  @IsOptional()
  digitalPreviewUrl?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  downloadLimit?: number;
}
