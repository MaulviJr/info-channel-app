export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            position INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_course_module_position UNIQUE (course_id, position)
        );
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS modules CASCADE;
    `);
};