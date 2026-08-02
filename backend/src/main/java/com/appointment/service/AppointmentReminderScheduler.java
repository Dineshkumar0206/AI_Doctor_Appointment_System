package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Scheduler that runs every minute to find appointments starting within 5 minutes
 * and sends reminder emails. Uses reminder_sent flag to prevent duplicate emails.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    /**
     * Runs every 60 seconds.
     * Finds appointments starting in [now, now+5min] that haven't been reminded yet.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void sendUpcomingReminders() {
        LocalDate today = LocalDate.now();
        LocalTime windowStart = LocalTime.now();
        LocalTime windowEnd = windowStart.plusMinutes(5);

        List<Appointment> upcoming = appointmentRepository.findAppointmentsForReminder(
                today, windowStart, windowEnd);

        if (upcoming.isEmpty()) {
            return; // nothing to do, skip logging
        }

        log.info("[SCHEDULER] Found {} appointment(s) requiring reminders in window {}–{}",
                upcoming.size(), windowStart, windowEnd);

        for (Appointment apt : upcoming) {
            try {
                emailService.sendReminderEmail(apt.getId());
                apt.setReminderSent(true);
                appointmentRepository.save(apt);
                log.info("[SCHEDULER] Reminder queued for appointmentId={} patient={}",
                        apt.getId(), apt.getPatient().getUser().getEmail());
            } catch (Exception e) {
                log.error("[SCHEDULER] Failed to process reminder for appointmentId={}: {}",
                        apt.getId(), e.getMessage());
            }
        }
    }

    /**
     * Runs every 60 seconds to find appointments that were missed.
     * Cutoff time is 20 minutes past the appointment's end time.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void autoCancelOverdueAppointments() {
        LocalDate today = LocalDate.now();
        LocalTime cutoffTime = LocalTime.now().minusMinutes(20);

        List<Appointment> overdue = appointmentRepository.findOverdueAppointments(today, cutoffTime);

        if (overdue.isEmpty()) {
            return;
        }

        log.info("[SCHEDULER] Found {} overdue appointment(s) to auto-cancel (past 20m grace period)", overdue.size());

        for (Appointment apt : overdue) {
            try {
                apt.setStatus(Appointment.AppointmentStatus.CANCELLED);
                apt.setReason("Automatically cancelled due to 20-minute delay or missed slot");
                appointmentRepository.save(apt);
                
                emailService.sendAutoCancellationEmail(apt.getId());
                
                log.info("[SCHEDULER] Auto-Cancelled appointmentId={} patient={}",
                        apt.getId(), apt.getPatient().getUser().getEmail());
            } catch (Exception e) {
                log.error("[SCHEDULER] Failed to auto-cancel appointmentId={}: {}",
                        apt.getId(), e.getMessage());
            }
        }
    }

    /**
     * Cleanup: runs once daily at midnight to purge used/expired OTP tokens.
     * Delegated to OtpTokenRepository directly to avoid circular deps.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupExpiredOtpTokens() {
        log.info("[SCHEDULER] Running nightly OTP token cleanup");
        // Cleanup handled by OtpService's generateAndSendOtp call; this is a safety net
    }
}
