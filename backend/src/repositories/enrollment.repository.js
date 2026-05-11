export const findEnrollmentByStudentCourse = (client, studentId, courseId) =>
    client.query(
        "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
        [studentId, courseId]
    );

export const createEnrollment = (client, studentId, courseId) =>
    client.query(
        "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING id, student_id, course_id, status, enrolled_at",
        [studentId, courseId]
    );

export const countActiveEnrollmentsByStudent = async (client, studentId) => {
    const result = await client.query(
        `SELECT COUNT(*) FROM enrollments 
         WHERE student_id = $1 AND status = 'active'`,
        [studentId]
    );
    return parseInt(result.rows[0].count, 10);
};

