-- V14: Add hospital details to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_details VARCHAR(255);
