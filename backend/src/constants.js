import dotenv from "dotenv";

dotenv.config();

export const config = {
	app: {
		port: Number(process.env.PORT) || 5000,
	},
	db: {
		host: process.env.DB_HOST || "localhost",
		port: Number(process.env.DB_PORT) || 5432,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
	},
};

export const requiredDbEnv = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_PORT"];
