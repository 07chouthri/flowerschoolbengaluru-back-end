import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/ecommerce";
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Example: postgres://user:password@localhost:5432/mydb"
  );
}

export const db = new Pool({
  connectionString: DATABASE_URL,
});
