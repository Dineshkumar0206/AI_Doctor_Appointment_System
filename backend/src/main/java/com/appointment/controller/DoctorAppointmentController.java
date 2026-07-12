package com.appointment.controller;

import com.appointment.dto.request.ConsultationNotesRequest;
import com.appointment.dto.response.ApiResponse;
import com.appointment.dto.response.AppointmentResponse;
import com.appointment.service.DoctorAppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/doctor/appointments")
@RequiredArgsConstructor
@Tag(name = "Doctor Appointments", description = "Appointment management APIs for doctors")
public class DoctorAppointmentController {

    private final DoctorAppointmentService doctorAppointmentService;

    @GetMapping
    @Operation(summary = "Search and filter appointments")
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getAppointments(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<AppointmentResponse> response = doctorAppointmentService.getAppointments(
                authentication.getName(), status, startDate, endDate, keyword, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Appointments retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            Authentication authentication,
            @PathVariable Long id) {
        AppointmentResponse response = doctorAppointmentService.getAppointmentById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment details retrieved successfully"));
    }

    @PutMapping("/{id}/notes")
    @Operation(summary = "Update simple notes for an appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateNotes(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String notes = body.get("notes");
        AppointmentResponse response = doctorAppointmentService.updateNotes(authentication.getName(), id, notes);
        return ResponseEntity.ok(ApiResponse.success(response, "Notes updated successfully"));
    }

    @PutMapping("/{id}/consultation")
    @Operation(summary = "Save consultation notes (diagnosis, prescription, advice, follow-up date)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> saveConsultation(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ConsultationNotesRequest request) {
        AppointmentResponse response = doctorAppointmentService.saveConsultationNotes(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Consultation notes saved successfully"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete an appointment and trigger patient completion email")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ConsultationNotesRequest request) {
        AppointmentResponse response = doctorAppointmentService.completeAppointment(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment completed successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment and trigger patient email")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : "Cancelled by doctor";
        AppointmentResponse response = doctorAppointmentService.cancelAppointment(authentication.getName(), id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment cancelled successfully"));
    }

    @PostMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule an appointment and trigger patient email")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime time) {
        AppointmentResponse response = doctorAppointmentService.rescheduleAppointment(authentication.getName(), id, date, time);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment rescheduled successfully"));
    }

    // ── AI Suggestions & Explanations ──

    @GetMapping("/{id}/ai-summary")
    @Operation(summary = "Generate AI summary of the appointment reasons")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiSummary(
            Authentication authentication,
            @PathVariable Long id) {
        String summary = doctorAppointmentService.generateAiSummary(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("summary", summary), "AI summary generated successfully"));
    }

    @GetMapping("/{id}/ai-diagnosis")
    @Operation(summary = "Generate AI diagnosis suggestions based on reason and history")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiDiagnosis(
            Authentication authentication,
            @PathVariable Long id) {
        String diagnosis = doctorAppointmentService.generateDiagnosisSuggestions(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("diagnosis", diagnosis), "AI diagnosis generated successfully"));
    }

    @GetMapping("/{id}/ai-prescription")
    @Operation(summary = "Generate AI prescription recommendations based on diagnosis")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiPrescription(
            Authentication authentication,
            @PathVariable Long id) {
        String prescription = doctorAppointmentService.generatePrescriptionSuggestions(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("prescription", prescription), "AI prescription generated successfully"));
    }

    @GetMapping("/{id}/ai-explanation")
    @Operation(summary = "Generate a patient-friendly explanation of diagnosis and prescription")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiExplanation(
            Authentication authentication,
            @PathVariable Long id) {
        String explanation = doctorAppointmentService.generatePatientExplanation(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("explanation", explanation), "AI patient explanation generated successfully"));
    }

    @GetMapping("/{id}/ai-followup")
    @Operation(summary = "Generate AI follow-up warnings and schedule recommendations")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAiFollowUp(
            Authentication authentication,
            @PathVariable Long id) {
        String followup = doctorAppointmentService.generateFollowUpAdvice(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("followup", followup), "AI follow-up recommendations generated successfully"));
    }
}
