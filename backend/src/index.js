import dotenv from "dotenv";
dotenv.config({ path: './.env' });
import app from "./app.js";
// import { config } from "./constants.js";

import { testDbConnection } from "./db/pool.js";

const startServer = async () => {
	await testDbConnection();
	console.log("Database connection established.");

	app.listen(process.env.PORT || 5000, () => {
		console.log(`Server running on port ${process.env.PORT || 5000}`);
	});
};



startServer().catch((error) => {
	console.error("Server startup failed:", error.message);
	process.exit(1);
});

