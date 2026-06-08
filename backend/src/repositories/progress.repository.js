export const upsertProgress = (client, userId, lectureId, courseId) =>
    client.query(
        `INSERT INTO progress (user_id, lecture_id, course_id, is_completed, completed_at)
         VALUES ($1, $2, $3, true, NOW())
         ON CONFLICT (user_id, lecture_id)
         DO UPDATE SET is_completed = true, completed_at = NOW(), updated_at = NOW()`,
        [userId, lectureId, courseId]
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