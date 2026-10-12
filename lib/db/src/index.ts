import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

let poolInstance: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (hasDatabaseUrl && process.env.DATABASE_URL) {
  try {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
    dbInstance = drizzle(poolInstance, { schema });
  } catch (err) {
    console.warn("Failed to initialize PostgreSQL pool:", err);
  }
}

export const pool = poolInstance as pg.Pool;
export const db = dbInstance as unknown as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";

