import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    }),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService],
})
export class ChatsModule {}
