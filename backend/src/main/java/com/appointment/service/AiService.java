package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.entity.Doctor;
import com.appointment.entity.DoctorAvailableSlot;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    @Autowired(required = false)
    private ChatClient chatClient;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    private String callAi(String prompt) {
        if (chatClient == null) {
            return "AI service is not configured. Please set a valid OPENAI_API_KEY.";
        }
        return chatClient.prompt().user(prompt).call().content();
    }

    /**
     * Suggest available appointment slots based on natural language query
     */
    @Transactional(readOnly = true)
    public String suggestAppointmentSlots(String query) {
        // Get all active doctors
        List<Doctor> doctors = doctorRepository.findByStatus(Doctor.DoctorStatus.ACTIVE);

        StringBuilder context = new StringBuilder();
        context.append("Available doctors and their schedules:\n\n");

        for (Doctor doctor : doctors) {
            context.append("Dr. ").append(doctor.getUser().getFullName())
                    .append(" - ").append(doctor.getSpecialization())
                    .append(" (").append(doctor.getExperience()).append(" years exp)")
                    .append("\nAvailable days: ");

            if (doctor.getAvailableSlots() != null) {
                String slots = doctor.getAvailableSlots().stream()
                        .filter(DoctorAvailableSlot::getIsAvailable)
                        .map(slot -> slot.getDayOfWeek().name() + " " +
                                     slot.getStartTime() + "-" + slot.getEndTime())
                        .collect(Collectors.joining(", "));
                context.append(slots);
            }
            context.append("\n\n");
        }

        String prompt = String.format("""
                You are an AI appointment scheduling assistant.
                
                Patient's request: %s
                
                Available doctors and schedules:
                %s
                
                Please suggest the best appointment slots based on the patient's request.
                Consider the specialization, day, and time preferences mentioned.
                Format your response clearly with doctor name, specialization, suggested date/time.
                Today's date is: %s
                """,
                query, context, LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy")));

        return callAi(prompt);
    }

    /**
     * Generate an AI summary for an appointment
     */
    @Transactional(readOnly = true)
    public String generateAppointmentSummary(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        String prompt = String.format("""
                Generate a brief, professional medical appointment summary.
                
                Appointment Details:
                - Patient: %s
                - Doctor: Dr. %s (%s)
                - Date: %s
                - Time: %s to %s
                - Reason: %s
                - Notes: %s
                - Status: %s
                
                Please provide:
                1. A concise summary of the appointment
                2. Key points to remember
                3. Any follow-up recommendations
                Keep it under 200 words, professional and clear.
                """,
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getDoctor().getSpecialization(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getReason() != null ? appointment.getReason() : "General consultation",
                appointment.getNotes() != null ? appointment.getNotes() : "None",
                appointment.getStatus()
        );

        return callAi(prompt);
    }

    /**
     * Natural language search for doctors
     */
    public String naturalLanguageDoctorSearch(String query) {
        List<Doctor> doctors = doctorRepository.findByStatus(Doctor.DoctorStatus.ACTIVE);

        StringBuilder doctorList = new StringBuilder();
        for (Doctor doctor : doctors) {
            doctorList.append("- Dr. ").append(doctor.getUser().getFullName())
                    .append(" | ").append(doctor.getSpecialization())
                    .append(" | ").append(doctor.getExperience()).append(" years | Fee: $")
                    .append(doctor.getConsultationFee()).append("\n");
        }

        String prompt = String.format("""
                You are a helpful medical appointment assistant.
                
                User query: %s
                
                Available doctors:
                %s
                
                Based on the user's query, recommend the most suitable doctor(s).
                Explain why each recommendation is suitable.
                Be concise and helpful.
                """,
                query, doctorList);

        return callAi(prompt);
    }

    /**
     * Generate appointment reminder message
     */
    @Transactional(readOnly = true)
    public String generateReminderMessage(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        String prompt = String.format("""
                Generate a friendly appointment reminder message for a patient.
                
                Details:
                - Patient Name: %s
                - Doctor: Dr. %s
                - Specialization: %s
                - Date: %s
                - Time: %s
                
                Generate a warm, professional reminder message that includes:
                1. Greeting with patient's name
                2. Appointment details
                3. What to bring/prepare
                4. Contact information note
                Keep it concise and friendly.
                """,
                appointment.getPatient().getUser().getFirstName(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getDoctor().getSpecialization(),
                appointment.getAppointmentDate().format(DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy")),
                appointment.getStartTime().format(DateTimeFormatter.ofPattern("hh:mm a"))
        );

        return callAi(prompt);
    }

    /**
     * General AI chat for appointment-related queries
     */
    public String chat(String message) {
        String systemMessage = """
                You are a helpful AI assistant for a medical appointment scheduling system.
                You help users with:
                - Finding suitable doctors
                - Scheduling appointments
                - Understanding medical specializations
                - General appointment-related queries
                Be professional, empathetic, and helpful.
                """;

        if (chatClient == null) {
            return "AI service is not configured. Please set a valid OPENAI_API_KEY.";
        }
        return chatClient.prompt()
                .system(systemMessage)
                .user(message)
                .call()
                .content();
    }
}
