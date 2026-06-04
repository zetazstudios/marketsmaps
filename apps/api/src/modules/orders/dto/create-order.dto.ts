import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  storeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
