import { Controller, Get, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteProfile(@Req() req: any) {
    return this.usersService.delete(req.user.id);
  }
}
