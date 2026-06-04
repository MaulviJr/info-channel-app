import { Router } from "express";
import {
	createAdmin,
	createTeacher,
	deleteUser,
	getProfileStatus,
	getCurrentUser,
	getTeacherProfile,
	getUserById,
	listAllUsers,
	listCourseStudents,
	listStudentsWithProfileStatus,
	listTeacherCourses,
	listTeacherStudents,
	loginUser,
	logoutUser,
	refreshTokenHandler,
	registerUser,
	updateTeacherProfile,
	updateStudentProfileHandler,
	updateUserStatus,
	getFullStudentProfile,
	getAdminStatsHandler,
	getAdminChartsHandler,
	getTeacherStatsHandler,
	getTeacherChartsHandler
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(upload.single("profilePicture"), registerUser);
router.route("/login").post(loginUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router
	.route("/profile/status")
	.get(verifyJWT, requireRole("student"), getProfileStatus);
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
router
	.route("/admin/stats")
	.get(verifyJWT, requireRole("admin"), getAdminStatsHandler);

router
	.route("/admin/charts")
	.get(verifyJWT, requireRole("admin"), getAdminChartsHandler);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshTokenHandler);
router.route("/admin/students/:id").get(verifyJWT, requireRole("admin"), getFullStudentProfile);
router
	.route("/admin/users")
	.get(verifyJWT, requireRole("admin"), listAllUsers);
router
	.route("/admin/users/:id")
	.get(verifyJWT, requireRole("admin"), getUserById)
	.delete(verifyJWT, requireRole("admin"), deleteUser);
router
	.route("/admin/users/:id/status")
	.patch(verifyJWT, requireRole("admin"), updateUserStatus);
router
	.route("/admin/students")
	.get(verifyJWT, requireRole("admin"), listStudentsWithProfileStatus);

router
	.route("/teacher/profile")
	.get(verifyJWT, requireRole("teacher"), getTeacherProfile)
	.put(verifyJWT, requireRole("teacher"), updateTeacherProfile);
router
	.route("/teacher/my-courses")
	.get(verifyJWT, requireRole("teacher"), listTeacherCourses);
router
	.route("/teacher/my-courses/:id/students")
	.get(verifyJWT, requireRole("teacher"), listCourseStudents);
router
	.route("/teacher/my-students")
	.get(verifyJWT, requireRole("teacher"), listTeacherStudents);
router.route("/teacher/stats").get(verifyJWT, requireRole("teacher"), getTeacherStatsHandler);
router.route("/teacher/charts").get(verifyJWT, requireRole("teacher"), getTeacherChartsHandler);

export default router;