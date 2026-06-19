

const getCourseForLearning = async (client, courseId, userId) => {
  return client.query(
    `SELECT 
        c.id AS course_id,
        c.title AS course_title,
        c.description AS course_description,
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
                         'position', lec.position,
                         'video_url', lec.video_url,
                         'is_completed', COALESCE(p.is_completed, false)
                     ) ORDER BY lec.position ASC
                 ) FILTER (WHERE lec.id IS NOT NULL), '[]'
             ) AS lectures
         FROM modules mod
         LEFT JOIN lectures lec ON mod.id = lec.module_id
         -- JOIN progress to attach user-specific completion status
         LEFT JOIN progress p ON lec.id = p.lecture_id AND p.user_id = $2
         GROUP BY mod.id
     ) m ON c.id = m.course_id
     WHERE c.id = $1
     GROUP BY c.id;`,
    [courseId, userId]
  );
};


export {getCourseForLearning };