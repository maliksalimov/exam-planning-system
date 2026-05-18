package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.dto.InstructorCreateRequest;
import com.malik.examplanningsystem.dto.InstructorResponse;
import com.malik.examplanningsystem.service.InstructorService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/instructors")
public class InstructorController {

    private final InstructorService instructorService;

    @PostMapping
    public ResponseEntity<InstructorResponse> createInstructor(
            @Valid @RequestBody InstructorCreateRequest request
    ){
        InstructorResponse response = instructorService.createInstructor(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<InstructorResponse>> getAllInstructors(){
        return ResponseEntity.ok(instructorService.getAllInstructors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstructorResponse> getInstructorById(@PathVariable Long id){
        return ResponseEntity.ok(instructorService.getInstructorById(id));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<InstructorResponse>> getInstructorsByDepartment(
            @PathVariable Long departmentId
    ){
        return ResponseEntity.ok(instructorService.getInstructorsByDepartmentId(departmentId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InstructorResponse> updateInstructor(
            @PathVariable Long id,
            @Valid @RequestBody InstructorCreateRequest request
    ){
        return ResponseEntity.ok(instructorService.updateInstructor(id, request));
    }

    @PostMapping("/recalculate-duties")
    public ResponseEntity<Void> recalculateDuties() {
        instructorService.recalculateDutyCounts();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInstructor(@PathVariable Long id){
        instructorService.deleteInstructor(id);
        return ResponseEntity.noContent().build();
    }
}
