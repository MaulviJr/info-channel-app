// FIXED: Added 'client' parameter and implicitly returned the query
export const findModulesByCourseId = (client, courseId) =>
    client.query(
        `SELECT id, course_id, title, position, created_at
         FROM modules
         WHERE course_id = $1
         ORDER BY position ASC`,
        [courseId]
    );

export const findModuleById = (client, moduleId) =>
    client.query(
        `SELECT id, course_id, title, position, created_at
         FROM modules
         WHERE id = $1`,
        [moduleId]
    );

// backend/src/repositories/module.repository.js

export const insertModule = (client, courseId, title) =>
    client.query(
        `INSERT INTO modules (course_id, title, position) 
         VALUES (
            $1, 
            $2, 
            COALESCE((SELECT MAX(position) + 1 FROM modules WHERE course_id = $1), 1)
         ) 
         RETURNING *`,
        [courseId, title]
    );
export const updateModuleById = (client, moduleId, title, position) =>
    client.query(
        `UPDATE modules 
         SET title = $1, position = $2 
         WHERE id = $3 
         RETURNING *`,
        [title, position, moduleId]
    );

// export const reorderModulesInDb = async (client, courseId, moduleId, oldPosition, newPosition) => {
//     // 1. Move target out of the way to position -1 (prevents UNIQUE constraint error)
//     await client.query(`UPDATE modules SET position = -1 WHERE id = $1`, [moduleId]);

//     // 2. Shift the other modules to make room
//     if (newPosition < oldPosition) {
//         // Dragging UP (e.g., 4 -> 2). Shift 2 & 3 down by adding 1.
//         await client.query(
//             `UPDATE modules 
//              SET position = position + 1 
//              WHERE course_id = $1 AND position >= $2 AND position < $3`,
//             [courseId, newPosition, oldPosition]
//         );
//     } else {
//         // Dragging DOWN (e.g., 2 -> 4). Shift 3 & 4 up by subtracting 1.
//         await client.query(
//             `UPDATE modules 
//              SET position = position - 1 
//              WHERE course_id = $1 AND position > $2 AND position <= $3`,
//             [courseId, oldPosition, newPosition]
//         );
//     }

//     // 3. Drop the target module into its new home
//     const { rows } = await client.query(
//         `UPDATE modules SET position = $1 WHERE id = $2 RETURNING *`,
//         [newPosition, moduleId]
//     );

//     return rows[0];
// };

// Replaces the old deleteModuleById to handle shifting

export const reorderModulesInDb = async (client, courseId, moduleId, oldPosition, newPosition) => {
    // 1. Move target out of the way to position -1
    await client.query(`UPDATE modules SET position = -1 WHERE id = $1`, [moduleId]);

    // 2. Shift the other modules into a deep negative temporary space
    // This entirely avoids Postgres's row-by-row UNIQUE constraint collisions
    const OFFSET = 10000;

    if (newPosition < oldPosition) {
        // Dragging UP (e.g., 5 -> 3). Shift 3 & 4 down by adding 1, but offset deeply.
        await client.query(
            `UPDATE modules 
             SET position = position + 1 - $1 
             WHERE course_id = $2 AND position >= $3 AND position < $4`,
            [OFFSET, courseId, newPosition, oldPosition]
        );
    } else {
        // Dragging DOWN (e.g., 2 -> 4). Shift 3 & 4 up by subtracting 1, but offset deeply.
        await client.query(
            `UPDATE modules 
             SET position = position - 1 - $1 
             WHERE course_id = $2 AND position > $3 AND position <= $4`,
            [OFFSET, courseId, oldPosition, newPosition]
        );
    }

    // 3. Restore the shifted modules from the negative space back to their final positions
    // We target `< -1` so we don't accidentally touch our target module sitting at `-1`
    await client.query(
        `UPDATE modules 
         SET position = position + $1 
         WHERE course_id = $2 AND position < -1`,
        [OFFSET, courseId]
    );

    // 4. Drop the target module into its new home
    const { rows } = await client.query(
        `UPDATE modules SET position = $1 WHERE id = $2 RETURNING *`,
        [newPosition, moduleId]
    );

    return rows[0];
};
export const deleteModuleAndShift = async (client, courseId, moduleId, deletedPosition) => {
    // 1. Delete the target module
    await client.query(`DELETE FROM modules WHERE id = $1`, [moduleId]);

    // 2. Shift everything below it UP by 1 to close the gap
    // If we delete position 2, then position 3 becomes 2, position 4 becomes 3.
    await client.query(
        `UPDATE modules 
         SET position = position - 1 
         WHERE course_id = $1 AND position > $2`,
        [courseId, deletedPosition]
    );
};