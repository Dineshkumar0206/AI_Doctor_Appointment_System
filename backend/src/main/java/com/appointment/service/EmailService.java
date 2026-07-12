package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.entity.User;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Email notification service contract.
 * All methods are async – they return immediately and send in the background.
 */
public interface EmailService {

    /** Feature 1: Sent when a user registers successfully */
    void sendWelcomeEmail(Long userId);

    /** Feature 2: Sends a 6-digit OTP for forgot password */
    void sendOtpEmail(Long userId, String otp);

    /** Feature 4: Sent when an appointment is booked */
    void sendAppointmentConfirmation(Long appointmentId);

    /** Feature 3: Sent when appointment starts within 5 minutes */
    void sendReminderEmail(Long appointmentId);

    /** Feature 5: Sent when an appointment is cancelled */
    void sendCancellationEmail(Long appointmentId, String reason);

    /** Feature 6: Sent when appointment date/time is changed */
    void sendRescheduleEmail(Long appointmentId, LocalDate oldDate, LocalTime oldTime);

    /** Feature 7: Sent when an appointment is completed */
    void sendAppointmentCompletionEmail(Long appointmentId);
}
