import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  decimal, 
  boolean,
  jsonb,
  customType,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom Type for PostGIS geometry(Point, 4326)
export const pointGeometry = customType<{ data: { lng: number; lat: number }; driverData: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value) {
    return value as any;
  }
});

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  
  // Extended profile fields for Phase 2 & 3
  userType: varchar('user_type', { length: 50 }).default('personal').notNull(), // 'personal', 'artesano', 'creador_digital', 'comercial'
  bio: text('bio'),
  socialLinks: jsonb('social_links').default(sql`'{}'::jsonb`),
  
  // Craftsman (Artesano) specifics
  story: text('story'),
  processImages: text('process_images').array().default(sql`'{}'::text[]`),
  
  // Location privacy and map status
  locationPrivacy: varchar('location_privacy', { length: 50 }).default('approximate').notNull(), // 'exact', 'approximate', 'city', 'invisible'
  reputation: decimal('reputation', { precision: 3, scale: 2 }).default('5.00'),
  isOnline: boolean('is_online').default(false).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. Stores Table (Fixed store pages / businesses)
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  address: text('address').notNull(),
  location: pointGeometry('location').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    locationIndex: index('idx_stores_location').on(table.location),
  };
});

// 3. Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  iconUrl: text('icon_url'),
  parentId: uuid('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
});

// 4. Products Table (Physical & Digital)
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  images: text('images').array().default(sql`'{}'::text[]`),
  stock: integer('stock').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'draft', 'out_of_stock'
  
  // Product type details
  productType: varchar('product_type', { length: 50 }).default('physical').notNull(), // 'physical', 'digital'
  condition: varchar('condition', { length: 50 }), // 'new', 'used', 'handmade', 'restored'
  deliveryMethod: varchar('delivery_method', { length: 100 }), // 'pickup', 'shipping', 'meet_up'
  
  // Digital specific details
  digitalFileUrl: text('digital_file_url'),
  digitalPreviewUrl: text('digital_preview_url'),
  downloadLimit: integer('download_limit'),
  downloadsCount: integer('downloads_count').default(0),
  multimediaPreview: jsonb('multimedia_preview').default(sql`'{}'::jsonb`), // preview structures, beats samples, portfolio JSON
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 5. Locations Table (Real-time tracking of dynamic users/deliveries)
export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  coordinate: pointGeometry('coordinate').notNull(),
  accuracy: decimal('accuracy'),
  speed: decimal('speed'),
  heading: decimal('heading'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    coordinateIndex: index('idx_locations_coordinate').on(table.coordinate),
  };
});

// 6. Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  deliveryAddress: text('delivery_address'),
  deliveryLocation: pointGeometry('delivery_location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 12, scale: 2 }).notNull(),
});

// 7. Chats Table
export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    buyerStoreUnique: unique('buyer_store_uniq').on(table.buyerId, table.storeId),
  };
});

// Messages Table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('text'), // 'text', 'image', 'audio', 'location'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 8. Reviews Table
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewerId: uuid('reviewer_id').references(() => users.id).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
