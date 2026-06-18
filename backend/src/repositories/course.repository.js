export const findAllPublishedCourses = (client, limit, offset) =>
    client.query(
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, u.name AS instructor_name
         FROM courses c
         JOIN users u ON c.instructor_id = u.id
         WHERE c.is_published = true
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

export const findAllCourses = (client, limit, offset) =>
    client.query(
        `SELECT c.id, c.title, c.description, c.admission_fee, c.monthly_fee, c.is_published, u.name AS instructor_name
         FROM courses c
         JOIN users u ON c.instructor_id = u.id
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
        `SELECT id, title, description, admission_fee, monthly_fee, is_published
         FROM courses
         WHERE instructor_id = $1
         LIMIT $2 OFFSET $3`,
        [instructorId, limit, offset]
    );

export const getCourseWithModulesAndLectures = (client, courseId) =>
  client.query(
    `SELECT 
        c.id AS course_id,
        c.title AS course_title,
        c.description AS course_description,
        c.admission_fee,
        c.monthly_fee,
        c.board_registration,
        c.thumbnail_url,
        u.name AS instructor_name,
        COALESCE(
            json_agg(
                json_build_object(
                    'module_id', m.id,
                    'module_title', m.title,
                    'position', m.position,
                    'lectures', m.lectures
                ) ORDER BY m.position ASC
            ) FILTER (WHERE m.id IS NOT NULL), '[]'
        ) AS modules
     FROM courses c
     LEFT JOIN users u ON c.instructor_id = u.id -- ADD: Join users to get instructor name
     LEFT JOIN (
         SELECT 
             mod.id,
             mod.course_id,
             mod.title,
             mod.position,
             COALESCE(
                 json_agg(
                     json_build_object(
                         'lecture_id', lec.id,
                         'lecture_title', lec.title,
                         'lecture_duration', lec.duration_sec,
                         'position', lec.position
                     ) ORDER BY lec.position ASC
                 ) FILTER (WHERE lec.id IS NOT NULL), '[]'
             ) AS lectures
         FROM modules mod
         LEFT JOIN lectures lec ON mod.id = lec.module_id
         GROUP BY mod.id
     ) m ON c.id = m.course_id
     WHERE c.id = $1
     GROUP BY c.id, u.name;`,
    [courseId]
  );

// export const getCourseStudents = (client, courseId, limit, offset) =>
//     client.query(
//         `SELECT
//             e.id AS enrollment_id,
//             u.id AS student_id,
//             u.name,
//             u.email,
//             e.status,
//             e.enrolled_at,
//             c.id AS course_id,
//             c.title AS course_title,
//             c.thumbnail_url AS course_thumbnail_url,
//             COALESCE(progress_stats.completed_lectures, 0) AS completed_lectures,
//             COALESCE(progress_stats.total_lectures, 0) AS total_lectures,
//             CASE
//                 WHEN COALESCE(progress_stats.total_lectures, 0) = 0 THEN 0
//                 ELSE ROUND((COALESCE(progress_stats.completed_lectures, 0)::numeric * 100) / progress_stats.total_lectures)
//             END AS percent
//          FROM users u
//          JOIN enrollments e ON u.id = e.student_id
//          JOIN courses c ON e.course_id = c.id
//          LEFT JOIN LATERAL (
//             SELECT
//                 COUNT(sl.id) AS total_lectures,
//                 COUNT(*) FILTER (WHERE p.completed = true) AS completed_lectures
//             FROM section_lectures sl
//             LEFT JOIN progress p
//                 ON p.lecture_id = sl.id
//                AND p.student_id = e.student_id
//             WHERE sl.course_id = c.id
//          ) progress_stats ON true
//          WHERE c.id = $1
//          ORDER BY e.enrolled_at DESC
//          LIMIT $2 OFFSET $3`,
//         [courseId, limit, offset]
//     );
export const getCourseStudents = (client, courseId, limit, offset) =>
    client.query(
        `SELECT
            e.id AS enrollment_id,
            u.id AS student_id,
            u.name,
            u.email,
            e.status,
            e.enrolled_at,
            c.id AS course_id,
            c.title AS course_title,
            c.thumbnail_url AS course_thumbnail_url,
            COALESCE(progress_stats.completed_lectures, 0) AS completed_lectures,
            COALESCE(progress_stats.total_lectures, 0) AS total_lectures,
            CASE
                WHEN COALESCE(progress_stats.total_lectures, 0) = 0 THEN 0
                ELSE ROUND((COALESCE(progress_stats.completed_lectures, 0)::numeric * 100) / progress_stats.total_lectures)
            END AS percent
         FROM users u
         JOIN enrollments e ON u.id = e.student_id
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN LATERAL (
            SELECT
                COUNT(l.id) AS total_lectures,
                -- Updated to map to the new 'is_completed' and 'user_id' columns in the progress table
                COUNT(p.id) FILTER (WHERE p.is_completed = true) AS completed_lectures
            FROM lectures l
            LEFT JOIN progress p
                ON p.lecture_id = l.id
               AND p.user_id = u.id 
            WHERE l.course_id = c.id
         ) progress_stats ON true
         WHERE c.id = $1
         ORDER BY e.enrolled_at DESC
         LIMIT $2 OFFSET $3`,
        [courseId, limit, offset]
    );
export const getTeacherStudents = (client, teacherId, limit, offset) =>
    client.query(
        `SELECT
            u.id,
            u.name,
            u.email,
            COUNT(DISTINCT c.id) AS courses_count,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') AS active_enrollments,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS completed_enrollments,
            MAX(e.enrolled_at) AS last_enrolled_at
         FROM users u
         JOIN enrollments e ON e.student_id = u.id
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = $1
         GROUP BY u.id, u.name, u.email
         ORDER BY MAX(e.enrolled_at) DESC
         LIMIT $2 OFFSET $3`,
        [teacherId, limit, offset]
    );

    export const createCourse = (
        client,
        { title, description, board_registration, admission_fee, monthly_fee, thumbnail_url },
        instructorId
    ) =>
    client.query(
            `INSERT INTO courses (title, description, board_registration, admission_fee, monthly_fee, thumbnail_url, instructor_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
            [title, description, board_registration, admission_fee, monthly_fee, thumbnail_url, instructorId]
    );

    export const updateCourse = (
        client,
        courseId,
        { title, description, board_registration, admission_fee, monthly_fee, thumbnail_url }
    ) =>
    client.query(
        `UPDATE courses
             SET title = $1, description = $2, board_registration = $3, admission_fee = $4, monthly_fee = $5, thumbnail_url = $6
             WHERE id = $7
         RETURNING *`,
            [title, description, board_registration, admission_fee, monthly_fee, thumbnail_url, courseId]
    );

export const deleteCourse = (client, courseId) =>
    client.query(
        `DELETE FROM courses
         WHERE id = $1
         RETURNING *`,
        [courseId]
    );