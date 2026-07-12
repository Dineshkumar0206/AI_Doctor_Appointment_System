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
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final ChatClient chatClientWithMemory;
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
            this.chatClientWithMemory = chatClientBuilder
                    .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
                    .build();
        } else {
            this.chatClient = null;
            this.chatClientWithMemory = null;
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

        if (chatClientWithMemory == null) {
            return "AI service is not configured. Please set a valid GROQ_API_KEY.";
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (authentication != null) ? authentication.getName() : "anonymous-session";

        return chatClientWithMemory.prompt()
                .system(systemMessage)
                .user(message)
                .advisors(a -> a.param("chat_memory_conversation_id", userEmail))
                .call()
                .content();
    }

    /**
     * Generate prescription suggestions based on diagnosis and symptoms/reason
     */
    @Transactional(readOnly = true)
    public String generatePrescriptionSuggestions(String diagnosis, String reason) {
        String prompt = String.format("""
                Suggest standard, safe, and professional medical prescription details (medication names, dosages, frequencies, and durations) based on:
                - Diagnosis: %s
                - Symptoms / Reason for Visit: %s
                
                Please list the recommended medications clearly in professional formatting. Include generic and popular brand names.
                Disclaimer: Include a brief standard medical advice disclaimer at the end.
                Keep it concise and clear.
                """,
                diagnosis != null && !diagnosis.isBlank() ? diagnosis : "Not specified",
                reason != null && !reason.isBlank() ? reason : "Not specified"
        );
        return callAi(prompt);
    }

    /**
     * Generate diagnosis suggestions based on symptoms and patient history notes
     */
    @Transactional(readOnly = true)
    public String generateDiagnosisSuggestions(String symptoms, String medicalNotes) {
        String prompt = String.format("""
                Act as an AI diagnosis assistant. Based on:
                - Symptoms / Patient Complaints: %s
                - Patient Medical Notes / History: %s
                
                Provide 2-3 potential diagnosis suggestions, explaining the rationale for each.
                State what diagnostic tests or checks could be done to confirm.
                Keep it professional, objective, and structured.
                """,
                symptoms != null && !symptoms.isBlank() ? symptoms : "Not specified",
                medicalNotes != null && !medicalNotes.isBlank() ? medicalNotes : "Not specified"
        );
        return callAi(prompt);
    }

    /**
     * Generate a simplified, patient-friendly explanation of a diagnosis and treatment plan
     */
    @Transactional(readOnly = true)
    public String generatePatientExplanation(String diagnosis, String prescription) {
        String prompt = String.format("""
                Explain the following medical details in simple, warm, and easy-to-understand terms suitable for a patient:
                - Medical Diagnosis: %s
                - Prescription Details: %s
                
                Ensure you explain:
                1. What the diagnosis means in layman's terms.
                2. How/when the prescribed medications should be taken, in simple terms.
                Keep it reassuring, clear, and under 150 words.
                """,
                diagnosis != null && !diagnosis.isBlank() ? diagnosis : "Not specified",
                prescription != null && !prescription.isBlank() ? prescription : "Not specified"
        );
        return callAi(prompt);
    }

    /**
     * Generate follow-up advice and warnings based on diagnosis and clinical advice
     */
    @Transactional(readOnly = true)
    public String generateFollowUpAdvice(String diagnosis, String advice) {
        String prompt = String.format("""
                Generate professional follow-up guidelines and warning signs for a patient based on:
                - Diagnosis: %s
                - Clinical Advice: %s
                
                Provide:
                1. What the patient should monitor closely.
                2. Red-flag symptoms or warning signs that require immediate medical attention.
                3. Follow-up scheduling recommendations (e.g. in 1 week, 2 weeks).
                Keep it concise and formatted with bullet points.
                """,
                diagnosis != null && !diagnosis.isBlank() ? diagnosis : "Not specified",
                advice != null && !advice.isBlank() ? advice : "Not specified"
        );
        return callAi(prompt);
    }
}
