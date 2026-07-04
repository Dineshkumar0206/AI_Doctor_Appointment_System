package com.appointment.controller;

import com.appointment.dto.response.ApiResponse;
import com.appointment.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-powered appointment assistant APIs")
public class AiController {

    private final AiService aiService;

    @PostMapping("/suggest-slots")
    @Operation(summary = "Get AI-suggested appointment slots based on natural language query")
    public ResponseEntity<ApiResponse<String>> suggestSlots(@RequestParam String query) {
        String response = aiService.suggestAppointmentSlots(query);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment slots suggested successfully"));
    }

    @GetMapping("/appointment-summary/{appointmentId}")
    @Operation(summary = "Generate AI summary for an appointment")
    public ResponseEntity<ApiResponse<String>> generateSummary(@PathVariable Long appointmentId) {
        String summary = aiService.generateAppointmentSummary(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Summary generated successfully"));
    }

    @PostMapping("/search-doctors")
    @Operation(summary = "Natural language doctor search")
    public ResponseEntity<ApiResponse<String>> searchDoctors(@RequestParam String query) {
        String response = aiService.naturalLanguageDoctorSearch(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/reminder/{appointmentId}")
    @Operation(summary = "Generate appointment reminder message")
    public ResponseEntity<ApiResponse<String>> generateReminder(@PathVariable Long appointmentId) {
        String reminder = aiService.generateReminderMessage(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(reminder, "Reminder generated successfully"));
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI appointment assistant")
    public ResponseEntity<ApiResponse<String>> chat(@RequestParam String message) {
        String response = aiService.chat(message);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
