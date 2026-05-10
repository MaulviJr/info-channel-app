export const up = (pgm) => {
  pgm.sql(`
    -- Add refresh token columns to users
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS refresh_token     VARCHAR(512),
      ADD COLUMN IF NOT EXISTS refresh_token_expires_at
                                                  TIMESTAMP WITH TIME ZONE;

    -- Index speeds up the lookup when validating an incoming refresh token
    CREATE INDEX IF NOT EXISTS idx_users_refresh_token
      ON users(refresh_token)
      WHERE refresh_token IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_refresh_token;

    ALTER TABLE users
      DROP COLUMN IF EXISTS refresh_token,
      DROP COLUMN IF EXISTS refresh_token_expires_at;
  `);
};