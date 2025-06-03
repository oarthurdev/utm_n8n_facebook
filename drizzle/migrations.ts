import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Run migrations programmatically
export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("Running migrations...");

  // Create connection
  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  // Apply migrations by running raw SQL to create tables if they don't exist
  try {
    // Users table
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;

    // Workflows table
    await client`
      CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        workflow_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'inactive',
        config JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Integrations table
    await client`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'disconnected',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Events table
    await client`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        source TEXT NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // UTM data table
    await client`
      CREATE TABLE IF NOT EXISTS utm_data (
        id SERIAL PRIMARY KEY,
        lead_id TEXT NOT NULL,
        source TEXT,
        medium TEXT,
        campaign TEXT,
        content TEXT,
        term TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Lead events table
    await client`
      CREATE TABLE IF NOT EXISTS lead_events (
        id SERIAL PRIMARY KEY,
        lead_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        sent_to_facebook BOOLEAN DEFAULT FALSE NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        sent_at TIMESTAMP
      );
    `;

    // Settings table
    await client`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT FALSE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}
