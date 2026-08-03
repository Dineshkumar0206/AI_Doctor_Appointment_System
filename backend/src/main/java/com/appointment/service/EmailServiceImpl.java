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

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Async email service implementation using Brevo's HTTP API + Thymeleaf HTML templates.
 * Every method is @Async to never block API response threads.
 *
 * NOTE: Switched from JavaMailSender (SMTP) to Brevo's REST API because Render
 * (and most cloud hosts) block outbound SMTP ports 25/465/587. HTTP on port 443
 * is never blocked, so the API-based approach works reliably in production.
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

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    // ── Feature 9: Email Verification OTP ────────────────────────────────────

    @Override
    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendEmailVerificationOtp(Long userId, String otp) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Context ctx = new Context();
            ctx.setVariable("userName", user.getFullName());
            ctx.setVariable("otp", otp);
            ctx.setVariable("supportEmail", supportEmail);
            ctx.setVariable("purpose", "Email Verification");

            String html = templateEngine.process("email/otp", ctx);
            sendEmail(user.getEmail(), "Verify Your Email – AI Appointment System", html);
            log.info("[EMAIL][SUCCESS] Verification OTP sent to={}", user.getEmail());
        } catch (Exception e) {
            log.error("[EMAIL][FAILED] Verification OTP failed for userId={} error={}", userId, e.getMessage(), e);
        }
    }



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

    // ── Internal send helper (now using Brevo's HTTP API instead of SMTP) ──────

    private void sendEmail(String to, String subject, String htmlBody) throws Exception {
        Map<String, Object> sender = new HashMap<>();
        sender.put("name", fromName);
        sender.put("email", fromEmail);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", sender);
        payload.put("to", List.of(recipient));
        payload.put("subject", subject);
        payload.put("htmlContent", htmlBody);

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 300) {
            throw new RuntimeException("Brevo API error " + response.statusCode() + ": " + response.body());
        }
    }
}
