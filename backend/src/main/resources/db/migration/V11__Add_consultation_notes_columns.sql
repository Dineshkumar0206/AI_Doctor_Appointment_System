-- V11: Add consultation notes columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS prescription TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS advice TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);
