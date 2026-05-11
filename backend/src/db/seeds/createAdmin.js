import bcrypt from "bcryptjs";
import { pool } from "../pool.js";

const name = process.env.ADMIN_NAME || "Super Admin";
const email = process.env.ADMIN_EMAIL || "admin@infochannel.com";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
    console.error("ADMIN_PASSWORD is required.");
    process.exit(1);
}

const createAdmin = async () => {
    try {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
            email,
        ]);
        if (existing.rowCount > 0) {
            console.log("Admin already exists for this email.");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
            [name, email, passwordHash]
        );

        console.log("Admin created.");
    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

createAdmin();
