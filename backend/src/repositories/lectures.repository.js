export const findLectureById = (client, lectureId) =>
    client.query(
        `SELECT id, course_id, title, video_url, position, created_at` +
        ` FROM lectures WHERE id = $1`,
        [lectureId]
    );

export const insertLecture = (client, moduleId, courseId, title, videoUrl, position, durationSec, isPreview) =>
    client.query(
        `INSERT INTO lectures (module_id, course_id, title, video_url, position, duration_sec, is_preview) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, module_id, course_id, title, video_url, position, duration_sec, is_preview, created_at`,
        [moduleId, courseId, title, videoUrl, position, durationSec, isPreview]
    );

export const updateLectureById = (client, lectureId, title, videoUrl, position, durationSec, isPreview) =>
    client.query(
        `UPDATE lectures SET title = $1, video_url = $2, position = $3, duration_sec = $4, is_preview = $5 WHERE id = $6 RETURNING id, module_id, course_id, title, video_url, position, duration_sec, is_preview, created_at`,
        [title, videoUrl, position, durationSec, isPreview, lectureId]
    );

export const deleteLectureById = (client, lectureId) =>
    client.query(
        `DELETE FROM lectures WHERE id = $1`,
        [lectureId]
    );  