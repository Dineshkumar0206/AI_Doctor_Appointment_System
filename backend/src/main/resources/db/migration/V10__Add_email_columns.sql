-- V10: Add email notification columns and OTP tokens table

-- Add email tracking columns to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT FALSE;

-- Create OTP tokens table for forgot password flow
CREATE TABLE IF NOT EXISTS otp_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp         VARCHAR(6)    NOT NULL,
    expiry_time TIMESTAMP     NOT NULL,
    used        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_user_id  ON otp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_expiry    ON otp_tokens(expiry_time);
