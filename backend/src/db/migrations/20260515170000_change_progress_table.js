export const up = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS progress CASCADE;

        CREATE TABLE progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
            is_completed BOOLEAN DEFAULT false,
            completed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_lecture_progress UNIQUE (user_id, lecture_id)
        );
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS progress CASCADE;

        CREATE TABLE progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            lecture_id UUID NOT NULL REFERENCES section_lectures(id) ON DELETE CASCADE,
            is_completed BOOLEAN DEFAULT false,
            completed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
};