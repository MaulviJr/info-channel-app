import { Router } from "express";
import {
	createEnrollmentHandler,
	updateEnrollmentStatusHandler,
} from "../controllers/enrollment.controller.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, requireRole("student"), createEnrollmentHandler);

router
	.route("/:id/status")
	.patch(verifyJWT, requireRole("admin"), updateEnrollmentStatusHandler);

export default router;
