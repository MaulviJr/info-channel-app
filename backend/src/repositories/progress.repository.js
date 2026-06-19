// backend/src/repositories/progress.repository.js
export const upsertProgress = (client, userId, courseId, lectureId, isCompleted) =>
    client.query(
        `INSERT INTO progress (user_id, course_id, lecture_id, is_completed, completed_at)
         VALUES ($1, $2, $3, $4, CASE WHEN $4::boolean THEN NOW() ELSE NULL END)
         ON CONFLICT (user_id, lecture_id)
         DO UPDATE SET 
            is_completed = EXCLUDED.is_completed, 
            completed_at = EXCLUDED.completed_at, 
            updated_at = NOW()
         RETURNING *`,
        [userId, courseId, lectureId, isCompleted]
    );

export const findProgressByCourse = (client, userId, courseId) =>
    client.query(
        `SELECT * FROM progress
         WHERE user_id = $1 
         AND course_id = $2
         AND is_completed = true`,
        [userId, courseId]
    );

export const findProgressByLecture = (client, userId, lectureId) =>
    client.query(
        `SELECT * FROM progress
         WHERE user_id = $1 AND lecture_id = $2`,
        [userId, lectureId]
    );

export const countCompletedLectures = (client, userId, courseId) =>
    client.query(
        `SELECT COUNT(*) AS completed_count
         FROM progress
         WHERE user_id = $1 
         AND course_id = $2
         AND is_completed = true`,
        [userId, courseId]
    );