import {
    getLecturesForModule,
    getLecture,
    createLecture,
    updateLecture,
    reorderLecture,
    deleteLecture
} from '../controllers/lectures.controller.js';
import { Router } from 'express';
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";
import upload from '../middlewares/multer.middleware.js';
const router = Router();

// have to set lecture so that only the name of the lecture and all modules are visible but they are locked only student can play the lecture
router.route('/module/:moduleId').get(getLecturesForModule); 
router.route('/:lectureId').get(getLecture);
router.route('/module/:moduleId/create').post(verifyJWT, requireRole('teacher', 'admin'), upload.single('video'), createLecture);
router.route('/:lectureId').put(verifyJWT, requireRole('teacher'), updateLecture).delete(verifyJWT, requireRole('admin'), deleteLecture);
router.route('/reorder').put(verifyJWT, requireRole('teacher', 'admin'), reorderLecture);

export default router;