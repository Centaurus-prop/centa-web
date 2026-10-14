import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

function getDatabaseUrl(): string {
  const url =
    process.env.CENTA_DATABASE_DATABASE_URL_UNPOOLED ||
    process.env.CENTA_DATABASE_DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
}

const sql = neon(getDatabaseUrl());

export const db = drizzle(sql, { schema });
export { sql as rawSql };
