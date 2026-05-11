import { Router } from "express";
import { createEnrollmentHandler } from "../controllers/enrollment.controller.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, requireRole("student"), createEnrollmentHandler);

export default router;
