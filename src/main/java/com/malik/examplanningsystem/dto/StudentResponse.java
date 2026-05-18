package com.malik.examplanningsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long studentId;
    private String studentNo;
    private String tcNo;
    private String fullName;
    private Long facultyId;
    private String facultyName;
    private Long departmentId;
    private String departmentName;
    private LocalDateTime createdAt;
}
