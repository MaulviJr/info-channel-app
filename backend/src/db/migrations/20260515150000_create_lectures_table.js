export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE lectures (
           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            video_url VARCHAR(1000),
            position INTEGER NOT NULL,
            duration_sec INTEGER DEFAULT 0,
            is_preview BOOLEAN DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_module_lecture_position UNIQUE (module_id, position)
        );
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS lectures CASCADE;
    `);
};