// FIXED: Added 'client' parameter and implicitly returned the query
export const findModulesByCourseId = (client, courseId) =>
    client.query(
        `SELECT id, course_id, title, position, created_at
         FROM modules
         WHERE course_id = $1
         ORDER BY position ASC`,
        [courseId]
    );

export const insertModule = (client, courseId, title, position) =>
    client.query(
        `INSERT INTO modules (course_id, title, position) 
         VALUES ($1, $2, $3) 
         RETURNING *`, // Using * returns all columns cleanly
        [courseId, title, position]
    );

export const updateModuleById = (client, moduleId, title, position) =>
    client.query(
        `UPDATE modules 
         SET title = $1, position = $2 
         WHERE id = $3 
         RETURNING *`,
        [title, position, moduleId]
    );

export const deleteModuleById = (client, moduleId) =>
    client.query(
        `DELETE FROM modules WHERE id = $1`,
        [moduleId]
    );

export const updateModulePosition = (client, moduleId, newPosition) =>
    client.query(
        `UPDATE modules 
         SET position = $1 
         WHERE id = $2 
         RETURNING *`,
        [newPosition, moduleId]
    );