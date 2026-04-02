import express from "express";
import cors from "cors";
import { query } from "./db/pool.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
	origin: process.env.CORS_ORIGIN || "*",
	credentials: true,
}));
app.use(express.json({
	limit: "16kb",
}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(cookieParser());
app.use(express.static("public"));
//imported routes
import userRouter from './routes/user.routes.js';

//routes.declaratoin
app.use("/api/v1/users", userRouter);

// app.get("/health", (req, res) => {
// 	res.status(200).json({
// 		status: "ok",
// 		service: "info-backend",
// 		uptime: process.uptime(),
// 		timestamp: new Date().toISOString(),
// 	});
// });

// app.get("/health/db", async (req, res) => {
// 	try {
// 		const result = await query("SELECT NOW() AS server_time");
// 		res.status(200).json({
// 			status: "ok",
// 			database: "connected",
// 			serverTime: result.rows[0].server_time,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			status: "error",
// 			database: "disconnected",
// 			message: error.message,
// 		});
// 	}
// });

export default app;

