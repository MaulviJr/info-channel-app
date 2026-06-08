import {
    completeLectureHandler, getCourseProgressHandler
} from '../controllers/progress.controller.js';
import { Router } from 'express';

const router = Router();

router.post('/complete', completeLectureHandler);
router.get('/:courseId', getCourseProgressHandler);
export default router;