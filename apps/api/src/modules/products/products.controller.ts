import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(dto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    return this.productsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.productsService.delete(id, req.user.id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') id: string) {
    return this.productsService.downloadDigitalFile(id);
  }
}
