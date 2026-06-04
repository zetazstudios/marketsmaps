import { Injectable } from '@nestjs/common';
import { db, chats, messages, stores } from '@marketsmaps/database';
import { eq, or, and, sql } from 'drizzle-orm';

@Injectable()
export class ChatsService {
  async getOrCreateChat(buyerId: string, storeId: string) {
    const [existing] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.buyerId, buyerId), eq(chats.storeId, storeId)))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [newChat] = await db
      .insert(chats)
      .values({
        buyerId,
        storeId,
      })
      .returning();

    return newChat;
  }

  async findUserChats(userId: string) {
    const result = await db.execute(sql`
      SELECT c.id, c.buyer_id as "buyerId", c.store_id as "storeId", c.created_at as "createdAt", c.updated_at as "updatedAt",
             s.name as "storeName", s.logo_url as "storeLogo"
      FROM chats c
      JOIN stores s ON c.store_id = s.id
      WHERE c.buyer_id = ${userId} OR s.owner_id = ${userId}
      ORDER BY c.updated_at DESC
    `);
    return result.rows;
  }

  async getChatMessages(chatId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }
}
