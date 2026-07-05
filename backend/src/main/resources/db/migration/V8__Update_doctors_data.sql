-- V8__Update_doctors_data.sql

-- 1. Update existing doctor's name and profile to represent a Karur cardiologist
UPDATE users 
SET first_name = 'Senthil', last_name = 'Kumar' 
WHERE email = 'dr.smith@appointment.com';

UPDATE doctors 
SET bio = 'Senior Consultant Cardiologist at Karur Heart & Lung Centre, Karur.' 
WHERE user_id = (SELECT id FROM users WHERE email = 'dr.smith@appointment.com');


-- 2. Insert Dr. Rajesh Kannan (Dindigul City Hospital)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'Rajesh',
    'Kannan',
    'dr.kannan@appointment.com',
    '$2a$10$8K1p/a0dR1xqDcBpd.O8TuMh.NiNLiJv.v2iicZFrZ2BXIHKjHdJi', -- Doctor@123
    '9876543221',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'dr.kannan@appointment.com' AND r.name = 'ROLE_DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Cardiology', 12, 'MD, DM (Cardio)', 'Consultant Cardiologist at Dindigul City Hospital, Dindigul.', 450.00, 'ACTIVE'
FROM users u WHERE u.email = 'dr.kannan@appointment.com'
ON CONFLICT DO NOTHING;

-- Slots for Dr. Rajesh Kannan (Mon/Tue/Thu 10:00 - 16:00)
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '10:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.kannan@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '10:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.kannan@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'THURSDAY', '10:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.kannan@appointment.com' ON CONFLICT DO NOTHING;


-- 3. Insert Dr. Meera Krishnan (Karur Children's Clinic)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'Meera',
    'Krishnan',
    'dr.meera@appointment.com',
    '$2a$10$8K1p/a0dR1xqDcBpd.O8TuMh.NiNLiJv.v2iicZFrZ2BXIHKjHdJi', -- Doctor@123
    '9876543222',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'dr.meera@appointment.com' AND r.name = 'ROLE_DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Pediatrics', 8, 'MBBS, DCH', 'Chief Pediatrician at Karur Children''s Clinic, Karur.', 300.00, 'ACTIVE'
FROM users u WHERE u.email = 'dr.meera@appointment.com'
ON CONFLICT DO NOTHING;

-- Slots for Dr. Meera Krishnan (Mon-Fri 09:00 - 13:00)
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.meera@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.meera@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.meera@appointment.com' ON CONFLICT DO NOTHING;


-- 4. Insert Dr. Anitha Raj (Dindigul Women's Hospital)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'Anitha',
    'Raj',
    'dr.anitha@appointment.com',
    '$2a$10$8K1p/a0dR1xqDcBpd.O8TuMh.NiNLiJv.v2iicZFrZ2BXIHKjHdJi', -- Doctor@123
    '9876543223',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'dr.anitha@appointment.com' AND r.name = 'ROLE_DOCTOR'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Gynecology', 15, 'MD, DGO', 'Senior Obstetrician and Gynecologist at Dindigul Women''s Hospital, Dindigul.', 500.00, 'ACTIVE'
FROM users u WHERE u.email = 'dr.anitha@appointment.com'
ON CONFLICT DO NOTHING;

-- Slots for Dr. Anitha Raj (Tue/Wed/Fri 14:00 - 18:00)
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.anitha@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.anitha@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.anitha@appointment.com' ON CONFLICT DO NOTHING;
