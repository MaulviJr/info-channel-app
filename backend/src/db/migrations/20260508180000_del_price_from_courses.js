export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            DROP COLUMN IF EXISTS price;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    `);
};