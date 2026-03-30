import app from "./app.js";
import { config } from "./constants.js";
import { testDbConnection } from "./db/pool.js";

const startServer = async () => {
	await testDbConnection();
	console.log("Database connection established.");

	app.listen(config.app.port, () => {
		console.log(`Server running on port ${config.app.port}`);
	});
};



startServer().catch((error) => {
	console.error("Server startup failed:", error.message);
	process.exit(1);
});

