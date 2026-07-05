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
@Slf4j
public class AiService {

    private final ChatClient chatClient;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @Autowired
    public AiService(
            @Autowired(required = false) ChatClient.Builder chatClientBuilder,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        if (chatClientBuilder != null) {
            this.chatClient = chatClientBuilder.build();
        } else {
            this.chatClient = null;
        }
    }

    private String callAi(String prompt) {
        if (chatClient == null) {
            return "AI service is not configured. Please set a valid GROQ_API_KEY.";
        }
        return chatClient.prompt().user(prompt).call().content();
    }

    /**
     * Helper method to build a rich context of all active doctors, schedules, fees, locations, and contacts.
     */
    private String getDoctorContextString() {
        List<Doctor> doctors = doctorRepository.findByStatus(Doctor.DoctorStatus.ACTIVE);
        StringBuilder context = new StringBuilder();
        for (Doctor doctor : doctors) {
            context.append("Dr. ").append(doctor.getUser().getFullName())
                    .append(" | Specialization: ").append(doctor.getSpecialization())
                    .append(" | Experience: ").append(doctor.getExperience()).append(" years")
                    .append(" | Consultation Fee: Rs. ").append(doctor.getConsultationFee())
                    .append(" | Contact: ").append(doctor.getUser().getPhone())
                    .append(" | Details: ").append(doctor.getBio()).append("\n");
            if (doctor.getAvailableSlots() != null) {
                String slots = doctor.getAvailableSlots().stream()
                        .filter(DoctorAvailableSlot::getIsAvailable)
                        .map(slot -> slot.getDayOfWeek().name() + " " +
                                     slot.getStartTime() + "-" + slot.getEndTime())
                        .collect(Collectors.joining(", "));
                if (!slots.isEmpty()) {
                    context.append("  Available slots: ").append(slots).append("\n");
                }
            }
            context.append("\n");
        }
        return context.toString();
    }

    /**
     * Suggest available appointment slots based on natural language query
     */
    @Transactional(readOnly = true)
    public String suggestAppointmentSlots(String query) {
        String context = getDoctorContextString();

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
    @Transactional(readOnly = true)
    public String naturalLanguageDoctorSearch(String query) {
        String doctorList = getDoctorContextString();

        String prompt = String.format("""
                You are a helpful medical appointment assistant.
                
                User query: %s
                
                Available doctors:
                %s
                
                Based on the user's query, recommend the most suitable doctor(s).
                Include their contact number and hospital location if requested or relevant.
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
    @Transactional(readOnly = true)
    public String chat(String message) {
        String doctorList = getDoctorContextString();
        String systemMessage = String.format("""
                You are a helpful AI assistant for a medical appointment scheduling system in Karur and Dindigul.
                You help users with:
                - Finding suitable doctors
                - Scheduling appointments
                - Understanding medical specializations
                - General appointment-related queries
                
                Be professional, empathetic, and helpful. Always directly answer the user's request.
                
                Below is the live list of available doctors in our system database. Use this data (including specializations, fees, hospitals, and contact numbers) to answer user queries and suggest doctors within their budget and preferred location. Do not make up any other doctors.
                
                Doctors Database:
                %s
                """, doctorList);

        if (chatClient == null) {
            return "AI service is not configured. Please set a valid GROQ_API_KEY.";
        }
        return chatClient.prompt()
                .system(systemMessage)
                .user(message)
                .call()
                .content();
    }
}
