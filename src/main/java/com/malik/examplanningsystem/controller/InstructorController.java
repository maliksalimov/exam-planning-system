package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.dto.InstructorCreateRequest;
import com.malik.examplanningsystem.dto.InstructorResponse;
import com.malik.examplanningsystem.service.InstructorService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/instructors")
@Tag(name = "Instructors", description = "Manage instructors and their invigilator duty counts")
@SecurityRequirement(name = "Bearer Authentication")
public class InstructorController {

    private final InstructorService instructorService;

    @PostMapping
    @Operation(summary = "Create an instructor")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Instructor created",
                    content = @Content(schema = @Schema(implementation = InstructorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "409", description = "Email already in use", content = @Content)
    })
    public ResponseEntity<InstructorResponse> createInstructor(
            @Valid @RequestBody InstructorCreateRequest request){
        InstructorResponse response = instructorService.createInstructor(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all instructors")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = InstructorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<List<InstructorResponse>> getAllInstructors(){
        return ResponseEntity.ok(instructorService.getAllInstructors());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get instructor by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Instructor found",
                    content = @Content(schema = @Schema(implementation = InstructorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Instructor not found", content = @Content)
    })
    public ResponseEntity<InstructorResponse> getInstructorById(@PathVariable Long id){
        return ResponseEntity.ok(instructorService.getInstructorById(id));
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get instructors by department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned",
                    content = @Content(schema = @Schema(implementation = InstructorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Department not found", content = @Content)
    })
    public ResponseEntity<List<InstructorResponse>> getInstructorsByDepartment(
            @PathVariable Long departmentId){
        return ResponseEntity.ok(instructorService.getInstructorsByDepartmentId(departmentId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an instructor")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Instructor updated",
                    content = @Content(schema = @Schema(implementation = InstructorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Instructor not found", content = @Content)
    })
    public ResponseEntity<InstructorResponse> updateInstructor(
            @PathVariable Long id,
            @Valid @RequestBody InstructorCreateRequest request){
        return ResponseEntity.ok(instructorService.updateInstructor(id, request));
    }

    @PostMapping("/recalculate-duties")
    public ResponseEntity<Void> recalculateDuties() {
        instructorService.recalculateDutyCounts();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an instructor")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Instructor deleted", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Instructor not found", content = @Content)
    })
    public ResponseEntity<Void> deleteInstructor(@PathVariable Long id){
        instructorService.deleteInstructor(id);
        return ResponseEntity.noContent().build();
    }
}
