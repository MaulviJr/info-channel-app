import { Router } from "express";
import {
	createAdmin,
	createTeacher,
	loginUser,
	registerUser,
	updateStudentProfileHandler,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(upload.single("profilePicture"), registerUser);
router.route("/login").post(loginUser);
router
	.route("/profile")
	.put(
		verifyJWT,
		requireRole("student"),
		upload.single("profilePicture"),
		updateStudentProfileHandler
	);
router
	.route("/admin/create-teacher")
	.post(verifyJWT, requireRole("admin"), createTeacher);
router
	.route("/admin/create-admin")
	.post(verifyJWT, requireRole("admin"), createAdmin);

export default router;