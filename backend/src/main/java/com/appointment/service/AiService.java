package com.appointment.service;

import com.appointment.entity.Appointment;
import com.appointment.entity.Doctor;
import com.appointment.entity.DoctorAvailableSlot;
import com.appointment.entity.Patient;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.DoctorRepository;
import com.appointment.repository.PatientRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.EmailService;
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
    private final InMemoryChatMemory chatMemory = new InMemoryChatMemory();

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private EmailService emailService;

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
                    .defaultAdvisors(new MessageChatMemoryAdvisor(this.chatMemory))
                    .build();
        } else {
            this.chatClient = null;
            this.chatClientWithMemory = null;
        }
    }

    public void clearChatMemory(String conversationId) {
        try {
            this.chatMemory.clear(conversationId);
            log.info("Cleared AI chat memory for conversationId: {}", conversationId);
        } catch (Exception e) {
            log.error("Failed to clear chat memory for conversationId: {}", conversationId, e);
        }
    }

    private String callAi(String prompt) {
        if (chatClient == null) {
            return "AI service is not configured. Please set a valid GROQ_API_KEY.";
        }
        try {
            return chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.error("AI service execution failed: {}", e.getMessage(), e);
            return "Error: AI service is currently unavailable. Please check the backend logs and ensure a valid GROQ_API_KEY is configured.";
        }
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
    @Transactional
    public String chat(String message) {
        LocalDate today = LocalDate.now();
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (authentication != null) ? authentication.getName() : "anonymous-session";
        boolean isDoctor = (authentication != null) && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

        String systemMessage;
        if (isDoctor) {
            systemMessage = String.format("""
                    You are a professional Clinical AI Assistant for medical practitioners (doctors) in our hospital system.
                    Current date today is: %s (%s).
                    
                    You help doctors with:
                    - Medical diagnosis guidelines and reference info
                    - Reviewing treatment options and drug interactions
                    - Structuring clinical case study notes and summaries
                    - Discussing symptoms and general medical queries
                    
                    Be concise, professional, scientific, and helpful. You are talking to a qualified medical professional, so speak with appropriate clinical vocabulary. Do not give simple patient-level explanations unless asked, and never output scheduling or booking command tags.
                    """, today.format(DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy")), today);
        } else {
            String doctorList = getDoctorContextString();
            systemMessage = String.format("""
                    You are a helpful AI assistant for a medical appointment scheduling system in Karur and Dindigul.
                    Current date today is: %s (%s).
                    
                    You help users with:
                    - Finding suitable doctors
                    - Scheduling appointments
                    - Understanding medical specializations
                    - General appointment-related queries
                    
                    Be professional, empathetic, and helpful. Always directly answer the user's request.
                    
                    Below is the live list of available doctors in our system database. Use this data (including specializations, fees, hospitals, and contact numbers) to answer user queries and suggest doctors. Do not make up any other doctors.
                    
                    Doctors Database:
                    %s
                    
                     CRITICAL INSTRUCTIONS FOR BOOKING APPOINTMENTS:
                     1. You DO NOT have the direct ability to book or confirm an appointment yourself in your text response.
                     2. To actually schedule and save an appointment in the database, you MUST append the following tag at the very end of your response:
                        [BOOK_APPOINTMENT:{"doctorName": "Doctor's Name", "date": "YYYY-MM-DD", "time": "HH:MM", "reason": "Reason for visit"}]
                     3. The system backend will read this tag, book the appointment in the database, and display the official confirmation to the user.
                     4. NEVER say "Your appointment is confirmed", "I have booked your appointment", or output a simulated confirmation block unless you append the tag.
                     5. If you do not append the tag, the appointment WILL NOT be booked.
                     6. You MUST calculate the exact date in YYYY-MM-DD format using today's date (%s). For example, if today is Sunday, July 12, 2026:
                        - "tomorrow" -> 2026-07-13
                        - "next Tuesday" -> 2026-07-14
                        - "this coming Friday" -> 2026-07-17
                     7. The time MUST be a single 24-hour time (e.g. "14:00" for 2:00 PM). Never output a range like "14:00-15:00" in the JSON tag.
                     8. DO NOT book the appointment or output the booking tag prematurely.
                     9. If the user has not explicitly chosen a specific doctor, date, AND time slot yet, DO NOT output the booking tag. Present the available options and ask the user to explicitly confirm their choice first.
                     10. NEVER assume a default slot or select a doctor automatically. The user must say "Yes, book with Dr. X at HH:MM on YYYY-MM-DD" or confirm an option you presented before you are allowed to append the [BOOK_APPOINTMENT:...] tag.
                     """, today.format(DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy")), today, doctorList, today);
        }

        if (chatClientWithMemory == null) {
            return "AI service is not configured. Please set a valid GROQ_API_KEY.";
        }

        try {
            String response = chatClientWithMemory.prompt()
                    .system(systemMessage)
                    .user(message)
                    .advisors(a -> a.param("chat_memory_conversation_id", userEmail))
                    .call()
                    .content();

            if (response != null && response.contains("[BOOK_APPOINTMENT:")) {
                response = processBookingCommand(response, userEmail);
            }

            return response;
        } catch (Exception e) {
            log.error("AI chat execution failed for user {}: {}", userEmail, e.getMessage(), e);
            return "Error: The AI assistant is currently unavailable. Please check the backend logs and ensure a valid GROQ_API_KEY is configured.";
        }
    }

    private String processBookingCommand(String response, String userEmail) {
        try {
            int startIdx = response.indexOf("[BOOK_APPOINTMENT:");
            int endIdx = response.indexOf("]", startIdx);
            if (endIdx == -1) return response;

            String commandJson = response.substring(startIdx + "[BOOK_APPOINTMENT:".length(), endIdx);
            
            String doctorName = getValueFromJson(commandJson, "doctorName");
            String dateStr = getValueFromJson(commandJson, "date");
            String timeStr = getValueFromJson(commandJson, "time");
            String reason = getValueFromJson(commandJson, "reason");

            if (doctorName.isEmpty() || dateStr.isEmpty() || timeStr.isEmpty()) {
                return response.substring(0, startIdx) + "\n\nError: Insufficient booking details parsed from AI command.";
            }

            // Find Doctor
            List<Doctor> doctors = doctorRepository.findAll();
            Doctor matchedDoctor = null;
            String normalizedDoctorSearch = doctorName.toLowerCase().replace("dr.", "").replace("dr", "").trim().replaceAll("\\s+", "");
            for (Doctor d : doctors) {
                String normalizedDoctorName = (d.getUser().getFirstName() + d.getUser().getLastName()).toLowerCase().replaceAll("\\s+", "");
                if (normalizedDoctorName.contains(normalizedDoctorSearch) || normalizedDoctorSearch.contains(normalizedDoctorName)) {
                    matchedDoctor = d;
                    break;
                }
            }

            if (matchedDoctor == null) {
                return response.substring(0, startIdx) + "\n\nError: Doctor '" + doctorName + "' was not found in our directory.";
            }

            // Find Patient
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return response.substring(0, startIdx) + "\n\nError: Only logged-in patients can book appointments.";
            }
            
            Patient patient = patientRepository.findByUserId(user.getId()).orElse(null);
            if (patient == null) {
                return response.substring(0, startIdx) + "\n\nError: No patient profile found for this account. Only registered patient users can book appointments.";
            }

            // Handle date parsing flexibility
            LocalDate appointmentDate;
            try {
                appointmentDate = LocalDate.parse(dateStr);
            } catch (Exception e) {
                return response.substring(0, startIdx) + "\n\n⚠️ **Booking Attempt Failed**\nThe system could not parse the date '" + dateStr + "' generated by the AI. Please ask the AI to book using a valid date format like YYYY-MM-DD (e.g. " + LocalDate.now().plusDays(1) + ").";
            }

            // Handle time parsing flexibility
            if (timeStr.contains("-")) {
                timeStr = timeStr.split("-")[0].trim();
            }
            if (timeStr.contains("/")) {
                timeStr = timeStr.split("/")[0].trim();
            }
            if (timeStr.length() == 2 && Character.isDigit(timeStr.charAt(0)) && Character.isDigit(timeStr.charAt(1))) {
                timeStr = timeStr + ":00";
            }

            LocalTime startTime;
            try {
                if (timeStr.length() == 5) {
                    startTime = LocalTime.parse(timeStr);
                } else if (timeStr.length() > 5) {
                    startTime = LocalTime.parse(timeStr.substring(0, 5));
                } else {
                    startTime = LocalTime.parse(timeStr);
                }
            } catch (Exception e) {
                return response.substring(0, startIdx) + "\n\n⚠️ **Booking Attempt Failed**\nThe system could not parse the time '" + timeStr + "' generated by the AI. Please ask the AI to book using a valid 24-hour time format like HH:MM (e.g. 14:00).";
            }

            LocalTime endTime = startTime.plusMinutes(30);

            // Check conflicts
            List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                    matchedDoctor.getId(),
                    appointmentDate,
                    startTime,
                    endTime
            );

            if (!conflicts.isEmpty()) {
                return response.substring(0, startIdx) + "\n\nI tried to book this appointment for you, but Dr. " + matchedDoctor.getUser().getFullName() + " is already booked or not available at " + timeStr + " on " + dateStr + ". Please suggest another time slot.";
            }

            // Book
            Appointment appointment = Appointment.builder()
                    .patient(patient)
                    .doctor(matchedDoctor)
                    .appointmentDate(appointmentDate)
                    .startTime(startTime)
                    .endTime(endTime)
                    .status(Appointment.AppointmentStatus.PENDING)
                    .reason(reason.isEmpty() ? "AI booked appointment" : reason)
                    .build();

            appointment = appointmentRepository.save(appointment);
            
            // Send confirmation email
            try {
                emailService.sendAppointmentConfirmation(appointment.getId());
            } catch (Exception e) {
                log.error("Failed to send AI booked confirmation email: {}", e.getMessage());
            }

            String successMsg = String.format("\n\n🎉 **Booking Confirmed!**\n- **Doctor**: Dr. %s\n- **Date**: %s\n- **Time**: %s\n- **Reason**: %s\n- **Status**: PENDING (confirmation email sent to %s)",
                    matchedDoctor.getUser().getFullName(), dateStr, timeStr, appointment.getReason(), user.getEmail());

            return response.substring(0, startIdx) + successMsg;

        } catch (Exception e) {
            log.error("Error processing AI booking command: {}", e.getMessage(), e);
            return response + "\n\n(Error processing appointment booking automatically: " + e.getMessage() + ")";
        }
    }

    private String getValueFromJson(String json, String key) {
        String pattern = "\"" + key + "\"";
        int keyIndex = json.indexOf(pattern);
        if (keyIndex == -1) return "";
        
        int colonIndex = json.indexOf(":", keyIndex);
        if (colonIndex == -1) return "";
        
        int start = colonIndex + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '"' || json.charAt(start) == ':' || json.charAt(start) == '\t' || json.charAt(start) == '\r' || json.charAt(start) == '\n')) {
            start++;
        }
        
        int end = start;
        while (end < json.length() && json.charAt(end) != '"' && json.charAt(end) != ',' && json.charAt(end) != '}' && json.charAt(end) != '\r' && json.charAt(end) != '\n') {
            end++;
        }
        
        if (start >= end) return "";
        return json.substring(start, end).trim();
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
