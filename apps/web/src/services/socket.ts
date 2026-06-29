import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const socketService = {
  connect(token: string) {
    if (socket) return socket;

    socket = io(API_URL, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('Connected to chat gateway WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat gateway WebSocket');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  // Subscribe to typing indicators
  onTyping(callback: (data: { chatId: string; isTyping: boolean }) => void) {
    if (!socket) return;
    socket.on('typing', callback);
  },

  // Emit typing indicator
  emitTyping(chatId: string, isTyping: boolean) {
    if (!socket) return;
    socket.emit('typing', { chatId, isTyping });
  },

  // Subscribe to new incoming messages
  onMessage(callback: (message: any) => void) {
    if (!socket) return;
    socket.on('message', callback);
  },

  // Emit a new message to a chat room
  emitMessage(chatId: string, content: string, type: 'text' | 'image' | 'audio' | 'location' = 'text') {
    if (!socket) return;
    socket.emit('sendMessage', { chatId, content, type });
  }
};
