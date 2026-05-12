export const findAllPublishedCourses = (client, limit, offset) =>
    client.query(
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, u.name AS instructor_name
         FROM courses c
         JOIN users u ON c.instructor_id = u.id
         WHERE c.is_published = true
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

export const findCourseById = (client, courseId) =>
    client.query(
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, u.name AS instructor_name
         FROM courses c
         JOIN users u ON c.instructor_id = u.id
         WHERE c.id = $1`,
        [courseId]
    );

export const findCoursesByInstructorId = (client, instructorId, limit, offset) =>
    client.query(
        `SELECT id, title, description, admission_fee, monthly_fee
         FROM courses
         WHERE instructor_id = $1
         LIMIT $2 OFFSET $3`,
        [instructorId, limit, offset]
    );

export const getCourseStudents = (client, courseId, limit, offset) =>
    client.query(
        `SELECT u.id, u.name, u.email
         FROM users u
         JOIN enrollments e ON u.id = e.student_id
         JOIN courses c ON e.course_id = c.id
         WHERE c.id = $1
         LIMIT $2 OFFSET $3`,
        [courseId, limit, offset]
    );
