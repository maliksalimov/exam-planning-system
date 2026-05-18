package com.malik.examplanningsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomResponse {
    private Long classroomId;
    private String campus;
    private String building;
    private String roomName;
    private Integer capacity;
    private Boolean isAvailable;
    private String technicalFeatures;
    private LocalDateTime createdAt;
}
