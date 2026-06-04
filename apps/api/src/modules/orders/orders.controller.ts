import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(dto, req.user.id);
  }

  @Get('buyer')
  async getBuyerOrders(@Req() req: any) {
    return this.ordersService.findBuyerOrders(req.user.id);
  }

  @Get('store')
  async getStoreOrders(@Req() req: any) {
    return this.ordersService.findStoreOrders(req.user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.ordersService.updateStatus(id, status, req.user.id);
  }
}
