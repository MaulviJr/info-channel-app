export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE enrollments
            DROP COLUMN IF EXISTS preferred_timing,
            DROP COLUMN IF EXISTS lumpsum_fee,
            DROP COLUMN IF EXISTS batch_name,
            DROP COLUMN IF EXISTS board_registration,
            DROP COLUMN IF EXISTS slip_number,
            DROP COLUMN IF EXISTS admission_fee,
            DROP COLUMN IF EXISTS monthly_fee;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE enrollments
            ADD COLUMN IF NOT EXISTS preferred_timing VARCHAR(100),
            ADD COLUMN IF NOT EXISTS lumpsum_fee NUMERIC(10, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS batch_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS board_registration VARCHAR(50) 
                CHECK (board_registration IN ('SDC', 'SBTE', 'None')),
            ADD COLUMN IF NOT EXISTS slip_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(10, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) DEFAULT 0.00;
    `);
};