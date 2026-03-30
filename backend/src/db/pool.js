import pg from "pg";

const { Pool } = pg;


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params = []) => pool.query(text, params);

export const testDbConnection = async () => {
  const result = await query("SELECT NOW() AS server_time");
  return result.rows[0];
};

export const closeDb = async () => {
  await pool.end();
};
