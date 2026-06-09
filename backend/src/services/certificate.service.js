export const issueCertificate = (client, userId, courseId) =>
    client.query(
        `INSERT INTO certificates (user_id, course_id) VALUES ($1, $2) RETURNING *`,
        [userId, courseId]
    );