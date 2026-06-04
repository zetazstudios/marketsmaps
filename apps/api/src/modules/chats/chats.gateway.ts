import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { db, messages } from '@marketsmaps/database';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) {
        client.disconnect();
        return;
      }
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      });
      client.data.userId = payload.sub;
      console.log(`Socket Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.chatId);
    console.log(`User ${client.data.userId} joined room: ${data.chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const [newMessage] = await db.insert(messages).values({
      chatId: data.chatId,
      senderId: client.data.userId,
      content: data.content,
      type: data.type || 'text',
    }).returning();

    this.server.to(data.chatId).emit('new_message', newMessage);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.chatId).emit('user_typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }
}
