
export const findLecturesByModuleId = (client, moduleId) =>
    client.query(
        `SELECT * FROM lectures 
         WHERE module_id = $1 
         ORDER BY position ASC`,
        [moduleId]
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
         VALUES ($1,
          $2, 
          $3, 
          $4, 
          COALESCE((SELECT MAX(position) + 1 FROM lectures WHERE module_id = $1), 1), 
          $6, $7) 
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

// NEW: The transaction-safe Drag-and-Drop reorder function (scoped to module_id)
export const reorderLecturesInDb = async (client, moduleId, lectureId, oldPosition, newPosition) => {
    // 1. Move out of the way
    await client.query(`UPDATE lectures SET position = -1 WHERE id = $1`, [lectureId]);

    // 2. Shift others inside the same module
    if (newPosition < oldPosition) {
        // Dragging UP
        await client.query(
            `UPDATE lectures 
             SET position = position + 1 
             WHERE module_id = $1 AND position >= $2 AND position < $3`,
            [moduleId, newPosition, oldPosition]
        );
    } else {
        // Dragging DOWN
        await client.query(
            `UPDATE lectures 
             SET position = position - 1 
             WHERE module_id = $1 AND position > $2 AND position <= $3`,
            [moduleId, oldPosition, newPosition]
        );
    }

    // 3. Drop into new home
    const { rows } = await client.query(
        `UPDATE lectures SET position = $1 WHERE id = $2 RETURNING *`,
        [newPosition, lectureId]
    );

    return rows[0];
};

// NEW: Replaces deleteLectureById to automatically close gaps in the module
export const deleteLectureAndShift = async (client, moduleId, lectureId, deletedPosition) => {
    // 1. Delete the lecture
    await client.query(`DELETE FROM lectures WHERE id = $1`, [lectureId]);

    // 2. Shift everything below it UP by 1 to close the gap in this specific module
    await client.query(
        `UPDATE lectures 
         SET position = position - 1 
         WHERE module_id = $1 AND position > $2`,
        [moduleId, deletedPosition]
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