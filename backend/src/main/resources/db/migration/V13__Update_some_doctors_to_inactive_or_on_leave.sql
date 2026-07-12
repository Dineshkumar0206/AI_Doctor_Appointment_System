-- V13__Update_some_doctors_to_inactive_or_on_leave.sql

-- Update some seeded doctors to ON_LEAVE
UPDATE doctors 
SET status = 'ON_LEAVE' 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('dr.kannan@appointment.com', 'dr.saravana@appointment.com')
);

-- Update some seeded doctors to INACTIVE
UPDATE doctors 
SET status = 'INACTIVE' 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('dr.anitha@appointment.com', 'dr.divya@appointment.com')
);
