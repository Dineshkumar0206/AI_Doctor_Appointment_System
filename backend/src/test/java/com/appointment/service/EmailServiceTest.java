package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.entity.Doctor;
import com.appointment.entity.Patient;
import com.appointment.entity.User;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService Unit Tests")
class EmailServiceTest {

    @Mock private JavaMailSender mailSender;
    @Mock private com.appointment.repository.UserRepository userRepository;
    @Mock private com.appointment.repository.AppointmentRepository appointmentRepository;
    @Mock private TemplateEngine templateEngine;
    @Mock private MimeMessage mimeMessage;

    @InjectMocks private EmailServiceImpl emailService;

    private User testUser;
    private Appointment testAppointment;

    @BeforeEach
    void setUp() {
        // Inject @Value fields
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@aiappointment.com");
        ReflectionTestUtils.setField(emailService, "fromName", "AI Appointment System");
        ReflectionTestUtils.setField(emailService, "supportEmail", "support@aiappointment.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");

        // Build test user
        testUser = User.builder()
                .id(1L)
                .firstName("Dinesh")
                .lastName("Kumar")
                .email("dinesh@test.com")
                .password("hashed")
                .build();

        // Build doctor user
        User doctorUser = User.builder()
                .id(2L)
                .firstName("Senthil")
                .lastName("Kumar")
                .email("dr.senthil@test.com")
                .build();

        // Build doctor
        Doctor doctor = Doctor.builder()
                .id(1L)
                .user(doctorUser)
                .specialization("Cardiology")
                .consultationFee(BigDecimal.valueOf(400))
                .bio("Senior Cardiologist at Karur Heart Centre")
                .build();

        // Build patient
        Patient patient = Patient.builder()
                .id(1L)
                .user(testUser)
                .build();

        // Build appointment
        testAppointment = Appointment.builder()
                .id(100L)
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(LocalDate.of(2025, 7, 10))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(Appointment.AppointmentStatus.PENDING)
                .reason("Chest pain checkup")
                .build();

        org.mockito.Mockito.lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        org.mockito.Mockito.lenient().when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html>test</html>");
        org.mockito.Mockito.lenient().when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(testUser));
        org.mockito.Mockito.lenient().when(appointmentRepository.findByIdWithDetails(100L)).thenReturn(java.util.Optional.of(testAppointment));
    }

    @Test
    @DisplayName("sendWelcomeEmail - should call templateEngine and mailSender")
    void sendWelcomeEmail_shouldCallMailSender() {
        emailService.sendWelcomeEmail(testUser.getId());

        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/welcome"), any(Context.class));
        verify(mailSender, timeout(2000).times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendOtpEmail - should process OTP template with correct OTP")
    void sendOtpEmail_shouldProcessOtpTemplate() {
        String otp = "483912";
        emailService.sendOtpEmail(testUser.getId(), otp);

        ArgumentCaptor<Context> ctxCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/otp"), ctxCaptor.capture());

        Context ctx = ctxCaptor.getValue();
        assert ctx.getVariable("otp").equals(otp);
        assert ctx.getVariable("userName").equals("Dinesh Kumar");
    }

    @Test
    @DisplayName("sendAppointmentConfirmation - should include appointmentId in context")
    void sendAppointmentConfirmation_shouldIncludeAppointmentId() {
        emailService.sendAppointmentConfirmation(testAppointment.getId());

        ArgumentCaptor<Context> ctxCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/confirmation"), ctxCaptor.capture());

        Context ctx = ctxCaptor.getValue();
        assert ctx.getVariable("appointmentId").equals(100L);
        assert ctx.getVariable("patientName").equals("Dinesh Kumar");
    }

    @Test
    @DisplayName("sendReminderEmail - should process reminder template")
    void sendReminderEmail_shouldProcessReminderTemplate() {
        emailService.sendReminderEmail(testAppointment.getId());

        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/reminder"), any(Context.class));
    }

    @Test
    @DisplayName("sendCancellationEmail - should include reason in context")
    void sendCancellationEmail_shouldIncludeReason() {
        String reason = "Doctor unavailable";
        emailService.sendCancellationEmail(testAppointment.getId(), reason);

        ArgumentCaptor<Context> ctxCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/cancelled"), ctxCaptor.capture());

        Context ctx = ctxCaptor.getValue();
        assert ctx.getVariable("reason").equals(reason);
    }

    @Test
    @DisplayName("sendRescheduleEmail - should include old and new date/time")
    void sendRescheduleEmail_shouldIncludeOldAndNewDatetime() {
        LocalDate oldDate = LocalDate.of(2025, 7, 5);
        LocalTime oldTime = LocalTime.of(9, 0);

        emailService.sendRescheduleEmail(testAppointment.getId(), oldDate, oldTime);

        ArgumentCaptor<Context> ctxCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine, timeout(2000).times(1))
                .process(eq("email/rescheduled"), ctxCaptor.capture());

        Context ctx = ctxCaptor.getValue();
        assert ctx.getVariable("newDate") != null;
        assert ctx.getVariable("oldDate") != null;
    }

    @Test
    @DisplayName("sendWelcomeEmail - when mail send fails, should log error and not throw")
    void sendWelcomeEmail_whenMailFails_shouldNotThrow() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw – errors are caught internally
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                () -> emailService.sendWelcomeEmail(testUser.getId()));
    }
}
