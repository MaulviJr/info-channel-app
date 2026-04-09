import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { query, closeDb } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const init = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check backend/.env");
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await query(schemaSql);
  console.log("Database schema initialized successfully.");
};

init()
  .catch((error) => {
    console.error("Failed to initialize database schema:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
