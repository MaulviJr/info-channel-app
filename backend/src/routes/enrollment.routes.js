import { Router } from "express";
import {
	createEnrollmentHandler,
	changeEnrollmentStatusHandler,
	// changePaymentStatusHandler,
	deleteEnrollmentHandler,
	getEnrollmentHandler,
	getMyEnrollmentsHandler,
	listEnrollmentsHandler
} from "../controllers/enrollment.controller.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, requireRole("student"), createEnrollmentHandler);

router
	.route("/:id/status")
	.patch(verifyJWT, requireRole("admin"), changeEnrollmentStatusHandler);

// router
// 	.route("/:id/payment-status")
// 	.patch(verifyJWT, requireRole("admin"), changePaymentStatusHandler);

router.route("/my").get(verifyJWT, requireRole("student"), getMyEnrollmentsHandler);
router
	.route("/:id")
	.get(verifyJWT, getEnrollmentHandler)
	.delete(verifyJWT, requireRole("admin"), deleteEnrollmentHandler);

router.route("/").get(verifyJWT, listEnrollmentsHandler);

export default router;
