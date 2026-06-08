import {
    completeLectureHandler, getCourseProgressHandler
} from '../controllers/progress.controller.js';
import { Router } from 'express';
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route('/course/:courseId').get(verifyJWT, getCourseProgressHandler);
router.route('/lecture/:lectureId/complete').post(verifyJWT, completeLectureHandler);
export default router;