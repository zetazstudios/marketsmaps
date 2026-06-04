import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { db, products, stores } from '@marketsmaps/database';
import { eq, and } from 'drizzle-orm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  async create(dto: CreateProductDto, ownerId: string) {
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, dto.storeId), eq(stores.ownerId, ownerId)))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('You do not own this store or store does not exist');
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        storeId: dto.storeId,
        categoryId: dto.categoryId || null,
        name: dto.name,
        description: dto.description || null,
        price: dto.price.toString(),
        currency: dto.currency || 'USD',
        images: dto.images || [],
        stock: dto.stock,
        productType: dto.productType,
        condition: dto.condition || null,
        deliveryMethod: dto.deliveryMethod || null,
        digitalFileUrl: dto.digitalFileUrl || null,
        digitalPreviewUrl: dto.digitalPreviewUrl || null,
        downloadLimit: dto.downloadLimit || null,
      })
      .returning();

    return newProduct;
  }

  async findAll() {
    return db.select().from(products);
  }

  async findOne(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto, ownerId: string) {
    const product = await this.findOne(id);
    
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, product.storeId), eq(stores.ownerId, ownerId)))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('You do not own the store this product belongs to');
    }

    const [updated] = await db
      .update(products)
      .set({
        ...dto,
        price: dto.price ? dto.price.toString() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, ownerId: string) {
    const product = await this.findOne(id);

    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, product.storeId), eq(stores.ownerId, ownerId)))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('You do not own the store this product belongs to');
    }

    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }

  async downloadDigitalFile(id: string) {
    const product = await this.findOne(id);

    if (product.productType !== 'digital') {
      throw new BadRequestException('This product is not digital');
    }

    if (!product.digitalFileUrl) {
      throw new NotFoundException('Digital file link not configured');
    }

    if (product.downloadLimit !== null && product.downloadsCount >= product.downloadLimit) {
      throw new ForbiddenException('Download limit reached for this file');
    }

    await db
      .update(products)
      .set({
        downloadsCount: product.downloadsCount + 1,
      })
      .where(eq(products.id, id));

    return { fileUrl: product.digitalFileUrl };
  }
}
