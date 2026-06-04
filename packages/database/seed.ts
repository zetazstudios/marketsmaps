import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/marketsmaps?schema=public';

const pool = new Pool({
  connectionString: databaseUrl,
});

const db = drizzle(pool, { schema });

// Hashed version of 'password123'
const MOCK_PASSWORD_HASH = '$2b$10$EP/4p661E.X.Q6k.yC49k.8zS1ZqL2L2RpeE6K5KjW5pLdDe9sR1y';

async function main() {
  console.log('Seeding database...');

  // Reset database tables
  await db.execute(sql`TRUNCATE TABLE reviews, order_items, orders, messages, chats, locations, products, categories, stores, users CASCADE;`);
  
  // 1. Insert Categories
  console.log('Inserting categories...');
  const [catArtesanal] = await db.insert(schema.categories).values({
    name: 'Artesanías',
    slug: 'artesanias',
    iconUrl: 'palette'
  }).returning();

  const [catDigital] = await db.insert(schema.categories).values({
    name: 'Productos Digitales',
    slug: 'digital',
    iconUrl: 'music'
  }).returning();

  const [catComida] = await db.insert(schema.categories).values({
    name: 'Alimentos y Bebidas',
    slug: 'alimentos',
    iconUrl: 'utensils'
  }).returning();

  const [catModa] = await db.insert(schema.categories).values({
    name: 'Moda y Ropa',
    slug: 'moda',
    iconUrl: 'shirt'
  }).returning();

  // 2. Insert Users
  console.log('Inserting users...');
  const [elena] = await db.insert(schema.users).values({
    email: 'elena@example.com',
    passwordHash: MOCK_PASSWORD_HASH,
    firstName: 'Elena',
    lastName: 'Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    userType: 'artesano',
    bio: 'Alfarera apasionada por crear objetos únicos con arcilla local.',
    story: 'Comencé mi taller en mi patio trasero y hoy mis cerámicas viajan por todo el mundo.',
    locationPrivacy: 'approximate',
    reputation: '4.90',
    isOnline: true
  }).returning();

  const [neo] = await db.insert(schema.users).values({
    email: 'neo@example.com',
    passwordHash: MOCK_PASSWORD_HASH,
    firstName: 'Neo',
    lastName: 'Sounds',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    userType: 'creador_digital',
    bio: 'Productor musical de ritmos Synthwave y Lofi Beats.',
    locationPrivacy: 'exact',
    reputation: '4.80',
    isOnline: true
  }).returning();

  const [carlos] = await db.insert(schema.users).values({
    email: 'carlos@example.com',
    passwordHash: MOCK_PASSWORD_HASH,
    firstName: 'Carlos',
    lastName: 'Gomez',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    userType: 'personal',
    bio: 'Vendedor casual de ropa retro y vintage.',
    locationPrivacy: 'city',
    reputation: '4.20',
    isOnline: true
  }).returning();

  const [tiendaOwner] = await db.insert(schema.users).values({
    email: 'tienda@example.com',
    passwordHash: MOCK_PASSWORD_HASH,
    firstName: 'Juan',
    lastName: 'Eco',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    userType: 'comercial',
    bio: 'Dueño de EcoTienda Orgánica.',
    locationPrivacy: 'exact',
    reputation: '4.60',
    isOnline: true
  }).returning();

  // 3. Insert Stores
  console.log('Inserting stores...');
  // Coordinates centered around Santiago de Chile (-33.4489, -70.6693)
  const [storeElena] = await db.insert(schema.stores).values({
    ownerId: elena.id,
    name: 'Elena Cerámicas Taller',
    description: 'Taller abierto de cerámica artesanal.',
    logoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=150&q=80',
    address: 'Av. Providencia 1200, Santiago',
    location: sql`ST_SetSRID(ST_MakePoint(-70.6713, -33.4459), 4326)`
  }).returning();

  const [storeNeo] = await db.insert(schema.stores).values({
    ownerId: neo.id,
    name: 'Neo Beats Lab',
    description: 'Estudio de audio y loops digitales.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    address: 'Calle Nueva York 45, Santiago',
    location: sql`ST_SetSRID(ST_MakePoint(-70.6643, -33.4529), 4326)`
  }).returning();

  const [storeJuan] = await db.insert(schema.stores).values({
    ownerId: tiendaOwner.id,
    name: 'EcoTienda Orgánica',
    description: 'Alimentos naturales y ecológicos directamente del campo.',
    logoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=150&q=80',
    address: 'Av. Andrés Bello 2300, Santiago',
    location: sql`ST_SetSRID(ST_MakePoint(-70.6673, -33.4479), 4326)`
  }).returning();

  const [storeCarlos] = await db.insert(schema.stores).values({
    ownerId: carlos.id,
    name: 'Carlos Ropa Vintage',
    description: 'Venta de garage de ropa vintage.',
    logoUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=150&q=80',
    address: 'San Antonio 300, Santiago',
    location: sql`ST_SetSRID(ST_MakePoint(-70.6733, -33.4509), 4326)`
  }).returning();

  // 4. Insert Locations (Realtime geolocations)
  console.log('Inserting locations...');
  await db.insert(schema.locations).values({
    userId: elena.id,
    coordinate: sql`ST_SetSRID(ST_MakePoint(-70.6713, -33.4459), 4326)`
  });

  await db.insert(schema.locations).values({
    userId: neo.id,
    coordinate: sql`ST_SetSRID(ST_MakePoint(-70.6643, -33.4529), 4326)`
  });

  await db.insert(schema.locations).values({
    userId: carlos.id,
    coordinate: sql`ST_SetSRID(ST_MakePoint(-70.6733, -33.4509), 4326)`
  });

  await db.insert(schema.locations).values({
    userId: tiendaOwner.id,
    coordinate: sql`ST_SetSRID(ST_MakePoint(-70.6673, -33.4479), 4326)`
  });

  // 5. Insert Products
  console.log('Inserting products...');
  // Elena (Artesana)
  await db.insert(schema.products).values({
    storeId: storeElena.id,
    categoryId: catArtesanal.id,
    name: 'Taza Barro Esculpido',
    description: 'Taza de arcilla esmaltada a mano con tonos terracota.',
    price: '18.00',
    stock: 12,
    productType: 'physical',
    condition: 'handmade',
    deliveryMethod: 'pickup',
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=300&q=80']
  });

  // Neo (Creador Digital)
  await db.insert(schema.products).values({
    storeId: storeNeo.id,
    categoryId: catDigital.id,
    name: 'Synthwave Loop Pack #3',
    description: '10 loops de sintetizador estilo retro futurista en alta fidelidad.',
    price: '25.00',
    stock: 9999,
    productType: 'digital',
    digitalFileUrl: 'https://example.com/secure-download-link-synthwave-pack.zip',
    digitalPreviewUrl: 'https://example.com/previews/synthwave-pack.mp3',
    downloadLimit: 5,
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80']
  });

  // Tienda Orgánica (Comercial)
  await db.insert(schema.products).values({
    storeId: storeJuan.id,
    categoryId: catComida.id,
    name: 'Miel Orgánica de Abeja',
    description: 'Miel silvestre 100% natural, recolectada a mano en la cordillera.',
    price: '8.50',
    stock: 50,
    productType: 'physical',
    condition: 'new',
    deliveryMethod: 'shipping',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80']
  });

  // Carlos (Personal)
  await db.insert(schema.products).values({
    storeId: storeCarlos.id,
    categoryId: catModa.id,
    name: 'Chaqueta de Jean Retro 90s',
    description: 'Chaqueta vaquera oversize original en excelente estado.',
    price: '35.00',
    stock: 1,
    productType: 'physical',
    condition: 'used',
    deliveryMethod: 'meet_up',
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=80']
  });

  console.log('Database seeded successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
