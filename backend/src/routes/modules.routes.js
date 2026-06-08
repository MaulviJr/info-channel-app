import {
    getModulesByCourseId,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
} from '../controllers/modules.controller.js';
import { Router } from 'express';

const router = Router();


router.get('/course/:courseId', getModulesByCourseId);
router.post('/course/:courseId', createModule);
router.put('/:moduleId', updateModule);
router.delete('/:moduleId', deleteModule);
router.put('/:moduleId/reorder', reorderModules);

export default router;