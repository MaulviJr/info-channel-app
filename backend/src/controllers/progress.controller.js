import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { pool } from '../db/pool.js';
import {
    completeLecture,
    getCourseProgress,
} from '../services/progress.service.js';

// POST /api/v1/progress/complete
const completeLectureHandler = asyncHandler(async (req, res) => {
    // Controller now only extracts data, validation happens in the service
    const { lectureId } = req.body;
    const userId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await completeLecture(client, userId, lectureId);

        await client.query('COMMIT');

        return res.status(200).json(
            new ApiResponse(200, result, 'Lecture progress updated')
        );
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
});

// GET /api/v1/progress/:courseId
const getCourseProgressHandler = asyncHandler(async (req, res) => {
    // Controller now only extracts data
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await getCourseProgress(pool, userId, courseId);

    return res.status(200).json(
        new ApiResponse(200, { progress }, 'Progress retrieved')
    );
});

export { completeLectureHandler, getCourseProgressHandler };