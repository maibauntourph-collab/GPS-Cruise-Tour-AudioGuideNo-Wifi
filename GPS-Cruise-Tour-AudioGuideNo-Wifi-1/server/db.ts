import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL not set. Database features will be unavailable.");
}

const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";
export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle({ client: pool, schema });
