package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.dto.StudentCreateRequest;
import com.malik.examplanningsystem.dto.StudentImportResult;
import com.malik.examplanningsystem.dto.StudentResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/students")
@Tag(name = "Students", description = "Manage student records")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @Operation(summary = "Create a student")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Student created",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "409", description = "Student number already exists", content = @Content)
    })
    public ResponseEntity<StudentResponse> createStudent(
            @Valid @RequestBody StudentCreateRequest request){
        StudentResponse response = studentService.createStudent(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all students")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<List<StudentResponse>> getAllStudents(){
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student found",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Student not found", content = @Content)
    })
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id){
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @GetMapping("/number/{studentNo}")
    @Operation(summary = "Get student by student number")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student found",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Student not found", content = @Content)
    })
    public ResponseEntity<StudentResponse> getStudentByStudentNo(@PathVariable String studentNo){
        return ResponseEntity.ok(studentService.getStudentByStudentNo(studentNo));
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get students by department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Department not found", content = @Content)
    })
    public ResponseEntity<List<StudentResponse>> getStudentsByDepartment(
            @PathVariable Long departmentId){
        return ResponseEntity.ok(studentService.getStudentsByDepartment(departmentId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a student")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student updated",
                    content = @Content(schema = @Schema(implementation = StudentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Student not found", content = @Content)
    })
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentCreateRequest request){
        return ResponseEntity.ok(studentService.updateStudent(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a student")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Student deleted", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Student not found", content = @Content)
    })
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id){
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import students from CSV or Excel file",
            description = "Columns: studentNo, tcNo, fullName, facultyId, departmentId. First row is header. Duplicate studentNo rows are skipped.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Import completed",
                    content = @Content(schema = @Schema(implementation = StudentImportResult.class))),
            @ApiResponse(responseCode = "400", description = "Unsupported file type or empty file", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<StudentImportResult> importStudents(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        StudentImportResult result = studentService.importStudents(file);
        return ResponseEntity.ok(result);
    }
}
