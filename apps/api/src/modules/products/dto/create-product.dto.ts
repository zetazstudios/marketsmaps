import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  storeId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  stock: number;

  @IsEnum(['physical', 'digital'])
  productType: string;

  @IsString()
  @IsOptional()
  @IsEnum(['new', 'used', 'handmade', 'restored'])
  condition?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  // Digital product fields
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
