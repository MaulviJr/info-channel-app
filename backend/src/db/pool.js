import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check backend/.env");
}


export const pool = new Pool({
  connectionString,
   ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const query = (text, params = []) => pool.query(text, params);

export const testDbConnection = async () => {
  const result = await query("SELECT NOW() AS server_time");
  return result.rows[0];
};

export const closeDb = async () => {
  await pool.end();
};
