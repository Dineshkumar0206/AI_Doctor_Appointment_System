package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Async email service implementation using JavaMailSender + Thymeleaf HTML templates.
 * Every method is @Async to never block API response threads.
 */
import com.appointment.repository.UserRepository;
import com.appointment.repository.AppointmentRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.mail.support-email}")
    private String supportEmail;

    @Value("${app.mail.frontend-url}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    // ── Feature 1: Welcome Email ───────────────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendWelcomeEmail(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Context ctx = new Context();
            ctx.setVariable("userName", user.getFullName());
            ctx.setVariable("userEmail", user.getEmail());
            ctx.setVariable("loginUrl", frontendUrl + "/login");
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/welcome", ctx);
            sendEmail(user.getEmail(), "Welcome to AI Appointment System 🏥", html);
            log.info("[EMAIL][SUCCESS] Welcome email sent to={} subject='Welcome to AI Appointment System'",
                    user.getEmail());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Welcome email failed for userId={} error={}", userId, e.getMessage(), e);
        }
    }

    // ── Feature 2: OTP Email ───────────────────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendOtpEmail(Long userId, String otp) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Context ctx = new Context();
            ctx.setVariable("userName", user.getFullName());
            ctx.setVariable("otp", otp);
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/otp", ctx);
            sendEmail(user.getEmail(), "Your Password Reset OTP – AI Appointment System", html);
            log.info("[EMAIL][SUCCESS] OTP email sent to={} subject='Password Reset OTP'", user.getEmail());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] OTP email failed for userId={} error={}", userId, e.getMessage(), e);
        }
    }

    // ── Feature 4: Appointment Confirmation ───────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendAppointmentConfirmation(Long appointmentId) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("appointmentId", apt.getId());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("specialization", apt.getDoctor().getSpecialization());
            ctx.setVariable("hospital", apt.getDoctor().getBio() != null ? apt.getDoctor().getBio() : apt.getDoctor().getSpecialization());
            ctx.setVariable("date", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("startTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("endTime", apt.getEndTime().format(TIME_FMT));
            ctx.setVariable("status", apt.getStatus().name());
            ctx.setVariable("reason", apt.getReason());
            ctx.setVariable("dashboardUrl", frontendUrl + "/appointments");
            ctx.setVariable("supportEmail", supportEmail);

            String emailSubject = "";
            if (apt.getStatus() == Appointment.AppointmentStatus.PENDING) {
                ctx.setVariable("headerIcon", "📅");
                ctx.setVariable("statusBadgeText", "APPOINTMENT BOOKED");
                ctx.setVariable("emailHeading", "Your appointment is booked!");
                ctx.setVariable("actionText", "booked");
                emailSubject = "Appointment Booked 📅 – AI Appointment System";
            } else {
                ctx.setVariable("headerIcon", "✅");
                ctx.setVariable("statusBadgeText", "APPOINTMENT CONFIRMED");
                ctx.setVariable("emailHeading", "Your appointment is confirmed!");
                ctx.setVariable("actionText", "confirmed");
                emailSubject = "Appointment Confirmed ✅ – AI Appointment System";
            }

            String html = templateEngine.process("email/confirmation", ctx);
            sendEmail(patientEmail, emailSubject, html);
            log.info("[EMAIL][SUCCESS] Confirmation/Booked sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Confirmation/Booked failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    // ── Feature 3: Appointment Reminder ───────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendReminderEmail(Long appointmentId) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("specialization", apt.getDoctor().getSpecialization());
            ctx.setVariable("hospital", apt.getDoctor().getBio() != null ? apt.getDoctor().getBio() : apt.getDoctor().getSpecialization());
            ctx.setVariable("location", "Please contact the hospital for directions");
            ctx.setVariable("date", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("startTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/reminder", ctx);
            sendEmail(patientEmail, "⏰ Appointment Reminder – Starts in 5 Minutes!", html);
            log.info("[EMAIL][SUCCESS] Reminder sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Reminder failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    // ── Feature 5: Cancellation Email ─────────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendCancellationEmail(Long appointmentId, String reason) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("date", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("startTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("reason", reason != null ? reason : "Appointment cancelled by request");
            ctx.setVariable("bookingUrl", frontendUrl + "/appointments");
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/cancelled", ctx);
            sendEmail(patientEmail, "Appointment Cancelled – AI Appointment System", html);
            log.info("[EMAIL][SUCCESS] Cancellation sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Cancellation failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    // ── Feature 6: Reschedule Email ───────────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendAutoCancellationEmail(Long appointmentId) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("date", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("startTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("bookingUrl", frontendUrl + "/appointments");
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/auto_cancelled", ctx);
            sendEmail(patientEmail, "⚠️ Appointment Automatically Cancelled due to Delay", html);
            log.info("[EMAIL][SUCCESS] Auto-Cancellation sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Auto-Cancellation failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendRescheduleEmail(Long appointmentId, LocalDate oldDate, LocalTime oldTime) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("oldDate", oldDate.format(DATE_FMT));
            ctx.setVariable("oldTime", oldTime.format(TIME_FMT));
            ctx.setVariable("newDate", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("newTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("dashboardUrl", frontendUrl + "/appointments");
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/rescheduled", ctx);
            sendEmail(patientEmail, "Appointment Rescheduled 📅 – AI Appointment System", html);
            log.info("[EMAIL][SUCCESS] Reschedule sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Reschedule failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendAppointmentCompletionEmail(Long appointmentId) {
        try {
            Appointment apt = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (apt == null) return;
            String patientEmail = apt.getPatient().getUser().getEmail();

            Context ctx = new Context();
            ctx.setVariable("patientName", apt.getPatient().getUser().getFullName());
            ctx.setVariable("doctorName", "Dr. " + apt.getDoctor().getUser().getFullName());
            ctx.setVariable("date", apt.getAppointmentDate().format(DATE_FMT));
            ctx.setVariable("startTime", apt.getStartTime().format(TIME_FMT));
            ctx.setVariable("diagnosis", apt.getDiagnosis() != null ? apt.getDiagnosis() : "Not specified");
            ctx.setVariable("prescription", apt.getPrescription() != null ? apt.getPrescription() : "None");
            ctx.setVariable("advice", apt.getAdvice() != null ? apt.getAdvice() : "None");
            ctx.setVariable("followUpDate", apt.getFollowUpDate() != null ? apt.getFollowUpDate().format(DATE_FMT) : "Not needed");
            ctx.setVariable("supportEmail", supportEmail);

            String html = templateEngine.process("email/completed", ctx);
            sendEmail(patientEmail, "Appointment Completed – Consultation Notes 🏥", html);
            log.info("[EMAIL][SUCCESS] Completion email sent to={} appointmentId={}", patientEmail, apt.getId());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Completion email failed for appointmentId={} error={}", appointmentId, e.getMessage());
        }
    }

    // ── Internal send helper ───────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String htmlBody) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }
}
