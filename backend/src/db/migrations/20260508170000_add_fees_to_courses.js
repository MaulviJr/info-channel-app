export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
            
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE courses
            DROP COLUMN IF EXISTS admission_fee,
            DROP COLUMN IF EXISTS monthly_fee;
    `);
};