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
import {upload} from '../middlewares/multer.middleware.js';
const router = Router();

// ==========================================
// 1. STATIC ROUTES (Must come first)
// ==========================================
router.route('/reorder')
  .put(verifyJWT, requireRole('teacher', 'admin'), reorderLecture);

// ==========================================
// 2. NESTED / SPECIFIC ROUTES 
// ==========================================
router.route('/module/:moduleId')
  .get(getLecturesForModule);

router.route('/module/:moduleId/create')
  .post(verifyJWT, requireRole('teacher', 'admin'), upload.single('video'), createLecture);

// ==========================================
// 3. DYNAMIC / WILDCARD ROUTES (Must come last)
// ==========================================
router.route('/:lectureId')
  .get(getLecture)
  .put(verifyJWT, requireRole('teacher'), updateLecture)
  .delete(verifyJWT, requireRole('admin', 'teacher'), deleteLecture);

export default router;