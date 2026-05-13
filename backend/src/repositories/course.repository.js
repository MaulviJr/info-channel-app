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
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, c.instructor_id,
                c.is_published, u.name AS instructor_name
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

    export const createCourse = (client, { title, description, admission_fee, monthly_fee, thumbnail_url }, instructorId) =>
    client.query(
        `INSERT INTO courses (title, description, admission_fee, monthly_fee, thumbnail_url, instructor_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, description, admission_fee, monthly_fee, thumbnail_url, instructorId]
    );

export const updateCourse = (client, courseId, { title, description, admission_fee, monthly_fee, thumbnail_url }) =>
    client.query(
        `UPDATE courses
         SET title = $1, description = $2, admission_fee = $3, monthly_fee = $4, thumbnail_url = $5
         WHERE id = $6
         RETURNING *`,
        [title, description, admission_fee, monthly_fee, thumbnail_url, courseId]
    );

export const deleteCourse = (client, courseId) =>
    client.query(
        `DELETE FROM courses
         WHERE id = $1
         RETURNING *`,
        [courseId]
    );