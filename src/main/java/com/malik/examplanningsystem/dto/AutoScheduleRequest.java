package com.malik.examplanningsystem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AutoScheduleRequest {

    @NotNull
    private Long courseId;

    @NotNull
    @Size(min = 1)
    private List<Long> studentIds;

    private LocalDate preferredDate;

    private String examName;

    private String examType;

    private Integer duration;
}
