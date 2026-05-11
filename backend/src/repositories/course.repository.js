export const findAllPublishedCourses = (client, limit, offset) =>
    client.query(
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, u.name AS instructor_name
         FROM courses c
         JOIN users u ON c.instructor_id = u.id
         WHERE c.is_published = true
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );