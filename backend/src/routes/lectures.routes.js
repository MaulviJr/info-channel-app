import {
    getLecturesForModule,
    getLecture,
    createLecture,
    updateLecture,
    reorderLecture,
    deleteLecture
} from '../controllers/lectures.controller.js';
import { Router } from 'express';

const router = Router();

router.get('/module/:moduleId', getLecturesForModule);
router.get('/:lectureId', getLecture);
router.post('/module/:moduleId', createLecture);
router.put('/:lectureId', updateLecture);
router.put('/:lectureId/reorder', reorderLecture);
router.delete('/:lectureId', deleteLecture);

export default router;