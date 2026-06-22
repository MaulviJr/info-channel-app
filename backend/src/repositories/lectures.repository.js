
export const findLecturesByModuleId = (client, moduleId) =>
    client.query(
        `SELECT * FROM lectures 
         WHERE module_id = $1 
         ORDER BY position ASC`,
        [moduleId]
    );

export const findLecturesByCourseId = (client, courseId) =>
    client.query(
        `SELECT * FROM lectures
        WHERE course_id = $1
        ORDER BY position ASC`,
        [courseId]
    );

// Fixed: Switched to SELECT * because your previous query forgot to fetch module_id, duration_sec, and is_preview
export const findLectureById = (client, lectureId) =>
    client.query(
        `SELECT * FROM lectures WHERE id = $1`,
        [lectureId]
    );

export const insertLecture = (client, moduleId, courseId, title, videoUrl, durationSec, isPreview) =>
    client.query(
        `INSERT INTO lectures (module_id, course_id, title, video_url, position, duration_sec, is_preview) 
         VALUES (
          $1, 
          $2, 
          $3, 
          $4, 
          COALESCE((SELECT MAX(position) + 1 FROM lectures WHERE module_id = $1), 1), 
          $5, 
          $6
         ) 
         RETURNING *`,
        [moduleId, courseId, title, videoUrl, durationSec, isPreview]
    );

// Fixed: Removed 'position' from this query. 
// This query should ONLY be used when editing the text/video content of a lecture.
export const updateLectureById = (client, lectureId, title, durationSec, isPreview) =>
    client.query(
        `UPDATE lectures 
         SET title = $1, duration_sec = $2, is_preview = $3 
         WHERE id = $4 
         RETURNING *`,
        [title, durationSec, isPreview, lectureId]
    );

export const reorderLecturesInDb = async (client, moduleId, lectureId, oldPosition, newPosition) => {
    // 1. Move target out of the way to position -1 (prevents UNIQUE constraint error)
    await client.query(`UPDATE lectures SET position = -1 WHERE id = $1`, [lectureId]);

    // 2. Shift the other lectures into a deep negative temporary space
    // This entirely avoids Postgres's row-by-row UNIQUE constraint collisions
    const OFFSET = 10000;

    if (newPosition < oldPosition) {
        // Dragging UP (e.g., 5 -> 3). Shift 3 & 4 down by adding 1, but offset deeply.
        await client.query(
            `UPDATE lectures 
             SET position = position + 1 - $1 
             WHERE module_id = $2 AND position >= $3 AND position < $4`,
            [OFFSET, moduleId, newPosition, oldPosition]
        );
    } else {
        // Dragging DOWN (e.g., 2 -> 4). Shift 3 & 4 up by subtracting 1, but offset deeply.
        await client.query(
            `UPDATE lectures 
             SET position = position - 1 - $1 
             WHERE module_id = $2 AND position > $3 AND position <= $4`,
            [OFFSET, moduleId, oldPosition, newPosition]
        );
    }

    // 3. Restore the shifted lectures from the negative space back to their final positions
    // We target `< -1` so we don't accidentally touch our target lecture sitting at `-1`
    await client.query(
        `UPDATE lectures 
         SET position = position + $1 
         WHERE module_id = $2 AND position < -1`,
        [OFFSET, moduleId]
    );

    // 4. Drop the target lecture into its new home
    const { rows } = await client.query(
        `UPDATE lectures SET position = $1 WHERE id = $2 RETURNING *`,
        [newPosition, lectureId]
    );

    return rows[0];
};

// NEW: Replaces deleteLectureById to automatically close gaps in the module safely
export const deleteLectureAndShift = async (client, moduleId, lectureId, deletedPosition) => {
    // 1. Delete the lecture completely
    await client.query(`DELETE FROM lectures WHERE id = $1`, [lectureId]);

    // 2. Shift everything below it UP by 1 to close the gap, using negative space
    const OFFSET = 10000;

    await client.query(
        `UPDATE lectures 
         SET position = position - 1 - $1 
         WHERE module_id = $2 AND position > $3`,
        [OFFSET, moduleId, deletedPosition]
    );

    // 3. Restore the shifted lectures from the negative space back to their final positive positions
    await client.query(
        `UPDATE lectures 
         SET position = position + $1 
         WHERE module_id = $2 AND position < 0`,
        [OFFSET, moduleId]
    );
};

export const countLecturesByCourse = (client, courseId) =>
    client.query(
        `SELECT COUNT(*) AS lecture_count FROM lectures WHERE course_id = $1`,
        [courseId]
    );

export const findPreviousLecture = (client, lectureId) => {
    // This finds the immediate preceding lecture within the SAME module.
    const query = `
        SELECT * FROM lectures 
        WHERE module_id = (SELECT module_id FROM lectures WHERE id = $1)
          AND position < (SELECT position FROM lectures WHERE id = $1)
        ORDER BY position DESC
        LIMIT 1
    `;
    
    return client.query(query, [lectureId]);
};