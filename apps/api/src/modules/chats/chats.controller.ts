import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async getOrCreate(@Body('storeId') storeId: string, @Req() req: any) {
    return this.chatsService.getOrCreateChat(req.user.id, storeId);
  }

  @Get()
  async getMyChats(@Req() req: any) {
    return this.chatsService.findUserChats(req.user.id);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.chatsService.getChatMessages(id);
  }
}
