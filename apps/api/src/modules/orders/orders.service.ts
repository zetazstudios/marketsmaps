import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { db, orders, orderItems, products, stores } from '@marketsmaps/database';
import { eq, and, sql } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  async create(dto: CreateOrderDto, buyerId: string) {
    let total = 0;
    const itemsToInsert = [];

    for (const item of dto.items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.storeId !== dto.storeId) {
        throw new BadRequestException(`Product ${product.name} does not belong to the selected store`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      total += parseFloat(product.price) * item.quantity;
      itemsToInsert.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
    }

    const locationSql = dto.latitude && dto.longitude 
      ? sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)` 
      : null;

    const [newOrder] = await db
      .insert(orders)
      .values({
        buyerId,
        storeId: dto.storeId,
        status: 'pending',
        totalAmount: total.toString(),
        deliveryAddress: dto.deliveryAddress || null,
        deliveryLocation: locationSql as any,
      })
      .returning();

    for (const item of itemsToInsert) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      });

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      
      await db
        .update(products)
        .set({ stock: product.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    return newOrder;
  }

  async findOne(id: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, status: string, ownerId: string) {
    const order = await this.findOne(id);

    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, order.storeId), eq(stores.ownerId, ownerId)))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('You do not own the store for this order');
    }

    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return updated;
  }

  async findBuyerOrders(buyerId: string) {
    return db.select().from(orders).where(eq(orders.buyerId, buyerId));
  }

  async findStoreOrders(ownerId: string) {
    const result = await db.execute(sql`
      SELECT o.id, o.buyer_id as "buyerId", o.store_id as "storeId", o.status, o.total_amount as "totalAmount", o.created_at as "createdAt",
             s.name as "storeName"
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE s.owner_id = ${ownerId}
      ORDER BY o.created_at DESC
    `);
    return result.rows;
  }
}
