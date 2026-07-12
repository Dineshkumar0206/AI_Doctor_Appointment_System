-- Clean up all existing available slots to reset them
DELETE FROM doctor_available_slots;

-- 1. Doctors with IDs 1 to 5 (e.g. Cardiologists & General Medicine)
-- Monday to Friday: Morning 09:00 - 13:00, Afternoon 14:00 - 16:00 (Lunch break 13:00 - 14:00)
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT id, day, CAST(start_t AS time), CAST(end_t AS time), 30, TRUE
FROM doctors
CROSS JOIN (
    VALUES 
    ('MONDAY', '09:00:00', '13:00:00'),
    ('MONDAY', '14:00:00', '16:00:00'),
    ('TUESDAY', '09:00:00', '13:00:00'),
    ('TUESDAY', '14:00:00', '16:00:00'),
    ('WEDNESDAY', '09:00:00', '13:00:00'),
    ('WEDNESDAY', '14:00:00', '16:00:00'),
    ('THURSDAY', '09:00:00', '13:00:00'),
    ('THURSDAY', '14:00:00', '16:00:00'),
    ('FRIDAY', '09:00:00', '13:00:00'),
    ('FRIDAY', '14:00:00', '16:00:00')
) AS days(day, start_t, end_t)
WHERE id BETWEEN 1 AND 5;

-- 2. Doctors with IDs 6 to 10 (e.g. Pediatricians)
-- Monday, Wednesday, Friday: Morning 09:00 - 13:00, Night 20:00 - 21:00 (Evening / Night session)
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT id, day, CAST(start_t AS time), CAST(end_t AS time), 30, TRUE
FROM doctors
CROSS JOIN (
    VALUES 
    ('MONDAY', '09:00:00', '13:00:00'),
    ('MONDAY', '20:00:00', '21:00:00'),
    ('WEDNESDAY', '09:00:00', '13:00:00'),
    ('WEDNESDAY', '20:00:00', '21:00:00'),
    ('FRIDAY', '09:00:00', '13:00:00'),
    ('FRIDAY', '20:00:00', '21:00:00')
) AS days(day, start_t, end_t)
WHERE id BETWEEN 6 AND 10;

-- 3. Doctors with IDs 11 to 15 (e.g. Dermatologists / Orthopedics)
-- Tuesday, Thursday: Morning 09:00 - 13:00, Afternoon 14:00 - 16:00, Night 20:00 - 21:00
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT id, day, CAST(start_t AS time), CAST(end_t AS time), 30, TRUE
FROM doctors
CROSS JOIN (
    VALUES 
    ('TUESDAY', '09:00:00', '13:00:00'),
    ('TUESDAY', '14:00:00', '16:00:00'),
    ('TUESDAY', '20:00:00', '21:00:00'),
    ('THURSDAY', '09:00:00', '13:00:00'),
    ('THURSDAY', '14:00:00', '16:00:00'),
    ('THURSDAY', '20:00:00', '21:00:00')
) AS days(day, start_t, end_t)
WHERE id BETWEEN 11 AND 15;

-- 4. Doctors with IDs 16 to 30 (Remaining seed doctors)
-- Monday, Thursday: Morning 09:00 - 13:00, Afternoon 14:00 - 16:00, Night 20:00 - 21:00
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT id, day, CAST(start_t AS time), CAST(end_t AS time), 30, TRUE
FROM doctors
CROSS JOIN (
    VALUES 
    ('MONDAY', '09:00:00', '13:00:00'),
    ('MONDAY', '14:00:00', '16:00:00'),
    ('MONDAY', '20:00:00', '21:00:00'),
    ('THURSDAY', '09:00:00', '13:00:00'),
    ('THURSDAY', '14:00:00', '16:00:00'),
    ('THURSDAY', '20:00:00', '21:00:00')
) AS days(day, start_t, end_t)
WHERE id >= 16;
