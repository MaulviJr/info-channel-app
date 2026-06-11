import {
    getModulesByCourseId,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
} from '../controllers/modules.controller.js';
import { Router } from 'express';
import { requireRole, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route('/course/:courseId').get(getModulesByCourseId);
router.route('/course/:courseId/create').post(verifyJWT, requireRole('teacher', 'admin'), createModule);
router.route('/:moduleId').put(verifyJWT, requireRole('teacher'), updateModule).delete(verifyJWT, requireRole('admin', 'teacher'), deleteModule);
router.route('/:courseId/reorder').put(verifyJWT, requireRole('teacher', 'admin'), reorderModules);


export default router;