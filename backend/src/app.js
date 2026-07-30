import express from "express";
import cors from "cors";
import { query } from "./db/pool.js";
import cookieParser from "cookie-parser";
const app = express();

app.set("trust proxy", 1);
app.use(cors({
	origin: process.env.CORS_ORIGIN,
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
import enrollmentRouter from './routes/enrollment.routes.js';
import courseRouter from './routes/course.routes.js';
import moduleRouter from './routes/modules.routes.js';
import progressRouter from './routes/progress.routes.js';
import learningRoutes from './routes/learning.routes.js';
import lectureRouter from './routes/lectures.routes.js';
//routes.declaratoin
app.use("/api/v1/users", userRouter);
app.use("/api/v1/enrollments", enrollmentRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/modules",moduleRouter );
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/lectures", lectureRouter);
app.use("/api/v1/learning", learningRoutes);

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

