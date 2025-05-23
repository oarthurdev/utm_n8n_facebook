import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Check for database URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a postgres connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// Create database instance with schema
export const db = drizzle(client, { schema });