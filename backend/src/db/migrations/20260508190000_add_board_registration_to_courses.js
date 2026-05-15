export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            ADD COLUMN IF NOT EXISTS board_registration VARCHAR(50)
                CHECK (board_registration IN ('SDC', 'SBTE', 'None'));
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            DROP COLUMN IF EXISTS board_registration;
    `);
};
