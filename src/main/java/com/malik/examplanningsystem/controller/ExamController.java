package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.dto.ExamAssignmentResponse;
import com.malik.examplanningsystem.dto.ExamCreateRequest;
import com.malik.examplanningsystem.dto.ExamResponse;
import com.malik.examplanningsystem.dto.StudentResponse;
import com.malik.examplanningsystem.service.ExamAssignmentService;
import com.malik.examplanningsystem.service.ExamService;
import com.malik.examplanningsystem.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/exams")
@AllArgsConstructor
@Tag(name = "Exams", description = "Manage exams — schedule, classroom, and course associations")
@SecurityRequirement(name = "Bearer Authentication")
public class ExamController {

    private final ExamService examService;
    private final ExamAssignmentService examAssignmentService;
    private final StudentService studentService;

    @PostMapping
    @Operation(summary = "Create an exam")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Exam created",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Course or classroom not found", content = @Content)
    })
    public ResponseEntity<ExamResponse> createExam(@Valid @RequestBody ExamCreateRequest request) {
        return new ResponseEntity<>(examService.createExam(request), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all exams")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<List<ExamResponse>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exam by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Exam found",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Exam not found", content = @Content)
    })
    public ResponseEntity<ExamResponse> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get exams by course")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Course not found", content = @Content)
    })
    public ResponseEntity<List<ExamResponse>> getExamsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(examService.getExamsByCourse(courseId));
    }

    @GetMapping("/classroom/{classroomId}")
    @Operation(summary = "Get exams by classroom")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Classroom not found", content = @Content)
    })
    public ResponseEntity<List<ExamResponse>> getExamsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(examService.getExamsByClassroom(classroomId));
    }

    @GetMapping("/date/{date}")
    @Operation(summary = "Get exams by date", description = "Date format: yyyy-MM-dd (e.g. 2026-06-15)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<List<ExamResponse>> getExamsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(examService.getExamsByDate(date));
    }

    @GetMapping("/{id}/eligible-students")
    @Operation(summary = "Get students eligible to be added to this exam",
            description = "Returns students not yet assigned to this exam. If departmentId is provided, also excludes students from that department who have a conflicting exam at the same date and time.")
    public ResponseEntity<List<StudentResponse>> getEligibleStudents(
            @PathVariable Long id,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(studentService.getEligibleStudents(id, departmentId));
    }

    @GetMapping("/{id}/students")
    @Operation(summary = "Get students assigned to an exam")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student assignment list returned"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Exam not found", content = @Content)
    })
    public ResponseEntity<List<ExamAssignmentResponse>> getStudentsByExam(@PathVariable Long id) {
        return ResponseEntity.ok(examAssignmentService.getAssignmentsByExam(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an exam")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Exam updated",
                    content = @Content(schema = @Schema(implementation = ExamResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Exam not found", content = @Content)
    })
    public ResponseEntity<ExamResponse> updateExam(@PathVariable Long id,
                                                    @Valid @RequestBody ExamCreateRequest request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an exam")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Exam deleted", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Exam not found", content = @Content)
    })
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }
}
