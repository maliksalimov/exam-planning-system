package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.dto.AutoScheduleRequest;
import com.malik.examplanningsystem.service.ExamPlanningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/exam-planning")
@Tag(name = "Exam Planning", description = "Automated exam planning — assigns students to classrooms and instructors as invigilators")
@SecurityRequirement(name = "Bearer Authentication")
public class ExamPlanningController {

    private final ExamPlanningService examPlanningService;

    @PostMapping("/plan/{examId}")
    @Operation(
            summary = "Run exam planning algorithm",
            description = "Given an exam ID and a list of student IDs, distributes students across available classrooms " +
                    "by capacity (largest first), assigns seat numbers sequentially, and auto-assigns invigilators " +
                    "based on duty count (fewest duties first). " +
                    "Rules: ≤50 students → 1 invigilator/room, ≤100 → 2, 101+ → 3."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Planning completed successfully — returns summary with classroom breakdown and invigilator assignments",
                    content = @Content),
            @ApiResponse(responseCode = "400", description = "No students provided or insufficient classroom capacity", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Exam or student not found", content = @Content)
    })
    public ResponseEntity<Map<String, Object>> planExam(
            @PathVariable Long examId,
            @RequestParam(name = "dryRun", defaultValue = "false") boolean dryRun,
            @RequestBody List<Long> studentIds) {
        return ResponseEntity.ok(examPlanningService.planExam(examId, studentIds, dryRun));
    }

    @DeleteMapping("/plan/{examId}")
    public ResponseEntity<Map<String, Object>> resetPlan(@PathVariable Long examId) {
        return ResponseEntity.ok(examPlanningService.resetExamPlan(examId));
    }

    @GetMapping("/conflicts")
    @Operation(summary = "Detect all conflicts across all exams")
    public ResponseEntity<List<Map<String, Object>>> getAllConflicts() {
        return ResponseEntity.ok(examPlanningService.detectAllConflicts());
    }

    @GetMapping("/conflicts/{examId}")
    @Operation(summary = "Detect conflicts for a specific exam",
            description = "Returns student double-bookings, instructor double-bookings, and classroom double-bookings scoped to the given exam.")
    public ResponseEntity<List<Map<String, Object>>> getConflictsForExam(@PathVariable Long examId) {
        return ResponseEntity.ok(examPlanningService.detectConflicts(examId));
    }

    @PostMapping("/auto-schedule")
    @Operation(summary = "Auto-schedule an exam",
            description = "Finds the first available date+time slot starting from preferredDate (or tomorrow if not specified) " +
                    "where all students, classrooms, and invigilators are free, then creates the exam and runs the planning algorithm. " +
                    "Tries up to 30 days across 4 daily time slots (09:00, 11:00, 13:00, 15:00).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Exam created and planned successfully", content = @Content),
            @ApiResponse(responseCode = "400", description = "No viable slot found in 30 days", content = @Content),
            @ApiResponse(responseCode = "404", description = "Course or student not found", content = @Content)
    })
    public ResponseEntity<Map<String, Object>> autoSchedule(
            @Valid @RequestBody AutoScheduleRequest request) {
        return ResponseEntity.ok(examPlanningService.autoScheduleExam(request));
    }
}
