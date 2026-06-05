export const up = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS section_lectures CASCADE;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        CREATE TABLE section_lectures (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            video_url VARCHAR(1000),
            position INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
};