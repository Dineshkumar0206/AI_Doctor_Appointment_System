-- V7__Insert_seed_data.sql
-- Insert Admin User (password: Admin@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'System',
    'Admin',
    'admin@appointment.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Admin@123
    '9999999999',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@appointment.com' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

-- Insert Sample Doctor User (password: Doctor@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'John',
    'Smith',
    'dr.smith@appointment.com',
    '$2a$10$8K1p/a0dR1xqDcBpd.O8TuMh.NiNLiJv.v2iicZFrZ2BXIHKjHdJi', -- Doctor@123
    '8888888888',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Assign doctor role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'dr.smith@appointment.com' AND r.name = 'ROLE_DOCTOR'
ON CONFLICT DO NOTHING;

-- Insert doctor profile
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Cardiology', 10, 'MD, FACC', 'Expert cardiologist with 10 years experience.', 500.00, 'ACTIVE'
FROM users u WHERE u.email = 'dr.smith@appointment.com'
ON CONFLICT DO NOTHING;

-- Insert doctor slots
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '09:00', '17:00', 30, TRUE
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'dr.smith@appointment.com'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '09:00', '17:00', 30, TRUE
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'dr.smith@appointment.com'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '09:00', '13:00', 30, TRUE
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'dr.smith@appointment.com'
ON CONFLICT DO NOTHING;

-- Insert Sample Patient User (password: Patient@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES (
    'Jane',
    'Doe',
    'jane.doe@appointment.com',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', -- Patient@123
    '7777777777',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Assign patient role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'jane.doe@appointment.com' AND r.name = 'ROLE_PATIENT'
ON CONFLICT DO NOTHING;

-- Insert patient profile
INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, emergency_contact, medical_notes)
SELECT u.id, '1990-05-15', 'FEMALE', 'O+', '123 Main Street, City, State', '7777777770', 'No known allergies.'
FROM users u WHERE u.email = 'jane.doe@appointment.com'
ON CONFLICT DO NOTHING;
