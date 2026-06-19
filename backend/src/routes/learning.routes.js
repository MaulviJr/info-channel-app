import { Router } from "express";
import { getLearningCourseHandler, updateProgressHandler } from "../controllers/learning.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Ensure only logged-in users access this
router.get("/courses/:courseId", getLearningCourseHandler);
router.post("/progress", updateProgressHandler);
export default router;
//    *In your `app.js`:* `app.use("/api/v1/learning", learningRoutes);`