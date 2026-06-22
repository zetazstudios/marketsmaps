import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['bug', 'suggestion', 'other'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['map', 'search', 'cart', 'chat', 'other'])
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  steps?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
