package com.malik.examplanningsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body for creating or updating an exam")
public class ExamCreateRequest {

    @NotBlank(message = "Exam name is required")
    @Size(max = 150, message = "Exam name must not exceed 150 characters")
    @Schema(description = "Descriptive name of the exam", example = "CS301 Midterm Exam")
    private String examName;

    @Size(max = 50, message = "Exam type must not exceed 50 characters")
    @Schema(description = "Type of exam (e.g. MIDTERM, FINAL, MAKEUP)", example = "MIDTERM")
    private String examType;

    @NotNull(message = "Exam date is required")
    @Schema(description = "Date of the exam (yyyy-MM-dd)", example = "2026-06-15")
    private LocalDate examDate;

    @NotNull(message = "Exam time is required")
    @Schema(description = "Start time of the exam (HH:mm)", example = "09:00")
    private LocalTime examTime;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Schema(description = "Duration of the exam in minutes", example = "120")
    private Integer duration;

    @NotNull(message = "Course ID is required")
    @Schema(description = "ID of the course this exam belongs to", example = "3")
    private Long courseId;

    @Schema(description = "ID of the primary classroom for this exam (optional — assigned during planning)", example = "1")
    private Long classroomId;

    @Schema(description = "Whether this is a common exam shared across sections", example = "false")
    private Boolean isCommonExam = false;
}
