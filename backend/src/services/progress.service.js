import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import {
    upsertProgress,
    findProgressByLecture,
    countCompletedLectures,
} from '../repositories/progress.repository.js';
import { findLectureById, findPreviousLecture, countLecturesByCourse } from '../repositories/lectures.repository.js';
import { findActiveEnrollment, updateEnrollmentStatus } from '../repositories/enrollment.repository.js';
// import { issueCertificate } from '../repositories/certificate.repository.js';

// Validation schemas moved from controller
const completeLectureSchema = z.object({
    lectureId: z.string().uuid('Invalid lecture ID'),
});

const courseIdSchema = z.object({
    courseId: z.string().uuid('Invalid course ID'),
});

// ─── Called by completeLectureHandler ────────────────────────────────────────
const completeLecture = async (client, userId, rawLectureId) => {

    // Step 0 — Validate Inputs
    const parsed = completeLectureSchema.safeParse({ lectureId: rawLectureId });
    if (!parsed.success) {
        throw new ApiError(400, 'Validation failed', parsed.error.issues);
    }
    const { lectureId } = parsed.data;

    // Step 1 — Does this lecture exist?
    const lectureResult = await findLectureById(client, lectureId);
    if (lectureResult.rowCount === 0) {
        throw new ApiError(404, 'Lecture not found');
    }
    const lecture = lectureResult.rows[0];
    const courseId = lecture.course_id;

    // Step 2 — Is student enrolled in this course?
    const enrollmentResult = await findActiveEnrollment(client, userId, courseId);
    if (enrollmentResult.rowCount === 0) {
        throw new ApiError(403, 'You are not enrolled in this course');
    }

    // Step 3 — Sequential lock: is previous lecture completed?
    const prevLectureResult = await findPreviousLecture(client, lectureId);
    if (prevLectureResult.rowCount > 0) {
        const prevLecture = prevLectureResult.rows[0];
        const prevProgress = await findProgressByLecture(client, userId, prevLecture.id);
        const prevCompleted = prevProgress.rows[0]?.is_completed;
        if (!prevCompleted) {
            throw new ApiError(403, 'Complete the previous lecture first');
        }
    }

    // Step 4 — Already completed? Return early (idempotent)
    const existing = await findProgressByLecture(client, userId, lectureId);
    if (existing.rows[0]?.is_completed) {
        const progress = await getCourseProgress(client, userId, courseId);
        return {
            completed:       true,
            courseCompleted: false,
            certificateId:   null,
            progress,
        };
    }

    // Step 5 — Mark this lecture complete
    await upsertProgress(client, userId, lectureId, courseId);

    // Step 6 — Recalculate progress
    const progress = await getCourseProgress(client, userId, courseId);

    // Step 7 — If 100%, complete enrollment and issue certificate
    if (progress.percent === 100) {
        await updateEnrollmentStatus(client, userId, courseId, 'completed');

        // const certificate = await issueCertificate(client, userId, courseId);

        return {
            completed:       true,
            courseCompleted: true,
            certificateId:   certificate.rows[0].id || null,
            progress,
        };
    }

    // Step 8 — Not done yet, return current state
    return {
        completed:       true,
        courseCompleted: false,
        certificateId:   null,
        progress,
    };
};

// ─── Called by getCourseProgressHandler + completeLecture ────────────────────
const getCourseProgress = async (client, userId, rawCourseId) => {
    
    // Step 0 — Validate Inputs
    const parsed = courseIdSchema.safeParse({ courseId: rawCourseId });
    if (!parsed.success) {
        throw new ApiError(400, 'Validation failed', parsed.error.issues);
    }
    const { courseId } = parsed.data;

    const [completedResult, totalResult] = await Promise.all([
        countCompletedLectures(client, userId, courseId),
        countLecturesByCourse(client, courseId),
    ]);

    const completed = parseInt(completedResult.rows[0].completed_count, 10);
    const total     = parseInt(totalResult.rows[0].total_count, 10);

    return {
        completedLectures: completed,
        totalLectures:     total,
        percent: total > 0
            ? Math.round((completed / total) * 100)
            : 0,
    };
};

export { completeLecture, getCourseProgress };