import { Router } from "express";
import {
	listCourses,
	getCourseById,
	createACourse,
	updateCourse,
	deleteCourse,
	toggleCoursePublish,
} from "../controllers/course.controller.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public
router.route("/").get(listCourses);
router.route("/:id").get(getCourseById);

// Teacher/Admin
router.route("/create-course").post(
  verifyJWT,
  requireRole("teacher", "admin"),
  createACourse
);
router
	.route("/:id")
	.put(verifyJWT, requireRole("teacher"), updateCourse)
	.delete(verifyJWT, requireRole("admin"), deleteCourse);

// Admin
router
	.route("/:id/publish")
	.patch(verifyJWT, requireRole("admin"), toggleCoursePublish);

export default router;
