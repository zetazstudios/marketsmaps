import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export * from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: DATABASE_URL is not set. Database client might fail to initialize.');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
