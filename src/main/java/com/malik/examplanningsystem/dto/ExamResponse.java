package com.malik.examplanningsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {

    private Long examId;
    private String examName;
    private String examType;
    private LocalDate examDate;
    private LocalTime examTime;
    private Integer duration;
    private Long courseId;
    private String courseName;
    private String courseCode;
    private Long classroomId;
    private String classroomName;
    private Integer classroomCapacity;
    private Boolean isCommonExam;
    private Integer studentCount;
    private LocalDateTime createdAt;
}
