import pg from "pg";
import { config, requiredDbEnv } from "../constants.js";

const { Pool } = pg;

for (const envKey of requiredDbEnv) {
  if (!process.env[envKey]) {
    throw new Error(`Missing required environment variable: ${envKey}`);
  }
}

export const pool = new Pool(config.db);

export const query = (text, params = []) => pool.query(text, params);

export const testDbConnection = async () => {
  const result = await query("SELECT NOW() AS server_time");
  return result.rows[0];
};

export const closeDb = async () => {
  await pool.end();
};
