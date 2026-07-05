-- V9__Add_20_doctors.sql

-- 1. Update the existing 4 doctors to ensure passwords and details conform to the name-derived password rule and include contact/hospital location details in their bio.

-- Dr. Senthil Kumar (Sen@123)
UPDATE users 
SET password = '$2a$10$Qwq5EzkOuG5tz/JJ10AjROmrXwH34N02Spp2v/39NNUku75bS365C', phone = '9443210101' 
WHERE email = 'dr.smith@appointment.com';

UPDATE doctors 
SET bio = 'Senior Consultant Cardiologist at Karur Heart & Lung Centre, Kovai Road, Karur. Contact: +91 94432 10101.' 
WHERE user_id = (SELECT id FROM users WHERE email = 'dr.smith@appointment.com');

-- Dr. Rajesh Kannan (Raj@123)
UPDATE users 
SET password = '$2a$10$f3ee.a8zNDcla3B2voX3QOjUt/acb.EnRnecLykpXkWoCMzLWNgKu', phone = '9443210102' 
WHERE email = 'dr.kannan@appointment.com';

UPDATE doctors 
SET bio = 'Consultant Cardiologist at Dindigul City Hospital, Bypass Road, Dindigul. Contact: +91 94432 10102.' 
WHERE user_id = (SELECT id FROM users WHERE email = 'dr.kannan@appointment.com');

-- Dr. Meera Krishnan (Mee@123)
UPDATE users 
SET password = '$2a$10$8pC9el/19VSCi7QLY8KfIOtF5PrUV5KSkn/sDHcggc.PdbjTkstyG', phone = '9443210103' 
WHERE email = 'dr.meera@appointment.com';

UPDATE doctors 
SET bio = 'Chief Pediatrician at Karur Children''s Clinic, Bus Stand Area, Karur. Contact: +91 94432 10103.' 
WHERE user_id = (SELECT id FROM users WHERE email = 'dr.meera@appointment.com');

-- Dr. Anitha Raj (Ani@123)
UPDATE users 
SET password = '$2a$10$uR9mlzlwQYVPsP6ZdHKd7O4/jwXbh2KeZa991S.QRuRGJx.iTEXmi', phone = '9443210104' 
WHERE email = 'dr.anitha@appointment.com';

UPDATE doctors 
SET bio = 'Senior Obstetrician and Gynecologist at Dindigul Women''s Hospital, Spencer Road, Dindigul. Contact: +91 94432 10104.' 
WHERE user_id = (SELECT id FROM users WHERE email = 'dr.anitha@appointment.com');


-- 2. Insert 17 more doctors to reach 21 doctors total.

-- Dr. Gopinath Sundar (Ophthalmology/Eye, Gop@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Gopinath', 'Sundar', 'dr.gopinath@appointment.com', '$2a$10$H04q0./2B1NnzGszTYnzU.If4sn2WfgX37FgQEM6yKVp1D6khTBEe', '9443210105', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.gopinath@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Ophthalmology', 11, 'MS, DO', 'Consultant Ophthalmologist at Karur Eye Care Hospital, Sengunthapuram, Karur. Contact: +91 94432 10105.', 350.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.gopinath@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '09:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.gopinath@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Kavitha Mani (Dentistry/Dentist, Kav@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Kavitha', 'Mani', 'dr.kavitha@appointment.com', '$2a$10$KGrtmBAN5fYEuRt7R2N7Uu2jvS70GHiqq9RTlI8ijX14Q1lvUEEMe', '9443210106', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.kavitha@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Dentistry', 9, 'BDS, MDS', 'Senior Dentist at Dindigul Dental Care, Palani Road, Dindigul. Contact: +91 94432 10106.', 300.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.kavitha@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '10:00', '17:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.kavitha@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Arvind Swamy (Orthopedics, Arv@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Arvind', 'Swamy', 'dr.arvind@appointment.com', '$2a$10$Z0fbiGhdPfDHD1mEnOj3quceKRGpcy/pUK.jeHDxHf8sa1CmobcyW', '9443210107', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.arvind@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Orthopedics', 14, 'MS (Ortho)', 'Orthopedic Surgeon at Karur Bone & Joint Centre, Kovai Road, Karur. Contact: +91 94432 10107.', 400.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.arvind@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '09:00', '15:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.arvind@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Divya Natesan (Dermatology, Div@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Divya', 'Natesan', 'dr.divya@appointment.com', '$2a$10$x3tXOXm/Os0yxIdi5K4QNOys.KQdGJcJBewz5p55.aHMy4mZ5tnGG', '9443210108', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.divya@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Dermatology', 10, 'MD (DVL)', 'Consultant Dermatologist at Dindigul Skin Clinic, Trichy Road, Dindigul. Contact: +91 94432 10108.', 450.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.divya@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'THURSDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.divya@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Saravana Kumar (General Medicine, Sar@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Saravana', 'Kumar', 'dr.saravana@appointment.com', '$2a$10$3QuhnilpN9HbYetVqzKD2O7EsnCNs5Qg1hd8VfwYnjYGiRRMx1Mmi', '9443210109', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.saravana@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'General Medicine', 15, 'MD (Gen Med)', 'General Physician at Karur General Hospital, Kovai Road, Karur. Contact: +91 94432 10109.', 250.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.saravana@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '09:00', '17:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.saravana@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Karthik Raja (Neurology, Kar@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Karthik', 'Raja', 'dr.karthik@appointment.com', '$2a$10$vKjIXQHET1Wl2WN3pXoJyuNM0xkyDmUAt0p7/qptvGuYP6yiXnQDK', '9443210110', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.karthik@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Neurology', 13, 'DM (Neuro)', 'Neurologist at Dindigul Neuro Centre, YMR Patti, Dindigul. Contact: +91 94432 10110.', 600.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.karthik@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '10:00', '15:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.karthik@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Harish Prasad (ENT, Har@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Harish', 'Prasad', 'dr.harish@appointment.com', '$2a$10$JNeUFhZl8G7uVEPjW8MWp.bmyv7jYNQy.ml0iL5aduGeY7ZBSQShe', '9443210111', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.harish@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'ENT', 8, 'MS (ENT)', 'ENT Specialist at Karur ENT Clinic, Sengunthapuram, Karur. Contact: +91 94432 10111.', 300.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.harish@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.harish@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Priya Dharshini (Pediatrics, Pri@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Priya', 'Dharshini', 'dr.priya@appointment.com', '$2a$10$3Fy.Mh54Y5Hs5lChjUuACuwiPOMfOuW8mJCaHxs0W45qygwgLPoVO', '9443210112', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.priya@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Pediatrics', 7, 'MD (Ped)', 'Pediatric Specialist at Dindigul Pediatric Hospital, Salai Road, Dindigul. Contact: +91 94432 10112.', 350.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.priya@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '10:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.priya@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Vijay Anand (Orthopedics, Vij@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Vijay', 'Anand', 'dr.vijay@appointment.com', '$2a$10$.pzNdq4CtqTUWWc2PtxEg.tIqoRcbVsId2ZeLW5eQmJXjh/GXAZri', '9443210113', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.vijay@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Orthopedics', 12, 'MS (Ortho)', 'Joint Replacement Expert at Dindigul Ortho Care, Palani Road, Dindigul. Contact: +91 94432 10113.', 400.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.vijay@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'THURSDAY', '09:00', '14:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.vijay@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Deepika Rajan (Dentistry/Dentist, Dee@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Deepika', 'Rajan', 'dr.deepika@appointment.com', '$2a$10$yAFaX.cPKz4QiAPLws.mF.PK3n9iL0YQinKOKs6OgiRyODnJj94.G', '9443210114', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.deepika@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Dentistry', 6, 'BDS, MDS', 'Orthodontist at Karur Dental Clinic, Kovai Road, Karur. Contact: +91 94432 10114.', 300.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.deepika@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '10:00', '16:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.deepika@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Prasanna Venkatesh (Ophthalmology/Eye, Pra@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Prasanna', 'Venkatesh', 'dr.prasanna@appointment.com', '$2a$10$Xbjnls7zwy7Wi6ywChttW.GmNtgnnRJd.ioI0zjneaYjCSS0r7Wpq', '9443210115', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.prasanna@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Ophthalmology', 15, 'MS (Ophth)', 'Cataract Surgeon at Dindigul Eye Hospital, Trichy Road, Dindigul. Contact: +91 94432 10115.', 400.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.prasanna@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.prasanna@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Bhanu Prasad (General Medicine, Bha@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Bhanu', 'Prasad', 'dr.bhanu@appointment.com', '$2a$10$Ig4Yj3zNXvMdEZ33rAcO2Ofk06HXtxluKjqgjYpaUID4ncvDVawi.', '9443210116', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.bhanu@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'General Medicine', 10, 'MBBS', 'Family Physician at Dindigul Medical Centre, YMR Patti, Dindigul. Contact: +91 94432 10116.', 200.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.bhanu@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '14:00', '19:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.bhanu@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Nithya Ram (Gynecology, Nit@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Nithya', 'Ram', 'dr.nithya@appointment.com', '$2a$10$TnJhDX0VIGHAEnZUsfvp0eS2.3gmraydj438udIuWHiRbTQPl5EjK', '9443210117', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.nithya@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Gynecology', 9, 'MD, DGO', 'Gynecologist at Karur Maternity Home, Kovai Road, Karur. Contact: +91 94432 10117.', 400.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.nithya@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '10:00', '15:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.nithya@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Sudhakar Rao (Neurology, Sud@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Sudhakar', 'Rao', 'dr.sudhakar@appointment.com', '$2a$10$6t3PoevilJtf9OTh1leo0.rtLaPpwXqXGShSz0iSr3c8rRqHsJ7E.', '9443210118', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.sudhakar@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Neurology', 16, 'MCh (Neurosurgery)', 'Neurosurgeon at Karur Brain & Spine Centre, Sengunthapuram, Karur. Contact: +91 94432 10118.', 650.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.sudhakar@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'THURSDAY', '09:00', '13:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.sudhakar@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Balaji Swaminathan (Dermatology, Bal@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Balaji', 'Swaminathan', 'dr.balaji@appointment.com', '$2a$10$vk7PGRGIbbSptSqj5DPRzuSRJYDpWof6Mn90oPy8B8iAMgIaUhYVW', '9443210119', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.balaji@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Dermatology', 11, 'MD (Dermatology)', 'Skin Specialist at Karur Skin & Laser Clinic, Kovai Road, Karur. Contact: +91 94432 10119.', 450.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.balaji@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.balaji@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Suresh Babu (ENT, Sur@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Suresh', 'Babu', 'dr.suresh@appointment.com', '$2a$10$S3/EayHxFVuRLUw8RmQfm.YxMD0eN5jwi6hF6jHWiEMerrknTRqta', '9443210120', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.suresh@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'ENT', 12, 'MS (ENT)', 'ENT Surgeon at Dindigul ENT Hospital, Bypass Road, Dindigul. Contact: +91 94432 10120.', 300.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.suresh@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '14:00', '18:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.suresh@appointment.com' ON CONFLICT DO NOTHING;

-- Dr. Manoj Kumar (Psychiatry, Man@123)
INSERT INTO users (first_name, last_name, email, password, phone, enabled)
VALUES ('Manoj', 'Kumar', 'dr.manoj@appointment.com', '$2a$10$/d2FhoL11/aH8TqdGfhcau4cr2WU98HF.DFeI3Q0zQhXZrKxJQUiW', '9443210121', TRUE) ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dr.manoj@appointment.com' AND r.name = 'ROLE_DOCTOR' ON CONFLICT DO NOTHING;
INSERT INTO doctors (user_id, specialization, experience, qualification, bio, consultation_fee, status)
SELECT u.id, 'Psychiatry', 10, 'MD (Psychiatry)', 'Psychiatrist at Karur Mind & Soul Clinic, Sengunthapuram, Karur. Contact: +91 94432 10121.', 400.00, 'ACTIVE' FROM users u WHERE u.email = 'dr.manoj@appointment.com' ON CONFLICT DO NOTHING;
INSERT INTO doctor_available_slots (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '09:00', '15:00', 30, TRUE FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'dr.manoj@appointment.com' ON CONFLICT DO NOTHING;
