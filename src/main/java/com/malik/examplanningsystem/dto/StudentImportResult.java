package com.malik.examplanningsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class StudentImportResult {

    private int imported;
    private int skipped;
    private List<String> errors;
}
