export const up = (pgm) => {
    pgm.sql(`
        DO $$
        DECLARE
            constraint_name text;
        BEGIN
            SELECT conname INTO constraint_name
            FROM pg_constraint
            WHERE conrelid = 'enrollments'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%status%';

            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE enrollments DROP CONSTRAINT %I', constraint_name);
            END IF;

            ALTER TABLE enrollments
                ADD CONSTRAINT enrollments_status_check
                CHECK (status IN ('active', 'completed', 'cancelled', 'pending_payment'));
        END $$;
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE enrollments
            DROP CONSTRAINT IF EXISTS enrollments_status_check;

        ALTER TABLE enrollments
            ADD CONSTRAINT enrollments_status_check
            CHECK (status IN ('active', 'completed', 'cancelled'));
    `);
};
