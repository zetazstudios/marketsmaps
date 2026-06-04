import { Injectable, NotFoundException } from '@nestjs/common';
import { db, users } from '@marketsmaps/database';
import { eq } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async findOne(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  async delete(id: string) {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }
}
