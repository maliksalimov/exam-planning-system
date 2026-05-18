package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.exception.ResourceNotFoundException;
import com.malik.examplanningsystem.repository.ExamAssignmentRepository;
import com.malik.examplanningsystem.repository.InvigilatorAssignmentRepository;
import com.malik.examplanningsystem.repository.InstructorRepository;
import com.malik.examplanningsystem.repository.StudentRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public / self-service query endpoints.
 *
 *  GET /api/student/query/{studentNo}   – student looks up their own exam seats (no auth required)
 *  GET /api/instructor/duties           – instructor sees their own upcoming invigilation duties (JWT required)
 */
@RestController
@AllArgsConstructor
public class QueryController {

    private final StudentRepository studentRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final InstructorRepository instructorRepository;
    private final InvigilatorAssignmentRepository invigilatorAssignmentRepository;

    /* ─────────────────────────────────────────
       STUDENT QUERY  (no authentication needed)
       ───────────────────────────────────────── */
    @GetMapping("/api/student/query/{studentNo}")
    public ResponseEntity<Map<String, Object>> queryStudentExams(@PathVariable String studentNo) {
        Student student = studentRepository.findByStudentNo(studentNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentNo));

        List<ExamAssignment> assignments = examAssignmentRepository.findByStudent(student);

        List<Map<String, Object>> examList = assignments.stream()
                .sorted((a, b) -> {
                    int d = a.getExam().getExamDate().compareTo(b.getExam().getExamDate());
                    return d != 0 ? d : a.getExam().getExamTime().compareTo(b.getExam().getExamTime());
                })
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("examId",     a.getExam().getExamId());
                    m.put("courseName", a.getExam().getExamName());
                    m.put("examDate",   a.getExam().getExamDate().toString());
                    m.put("examTime",   a.getExam().getExamTime().toString());
                    m.put("campus",     a.getClassroom().getCampus());
                    m.put("building",   a.getClassroom().getBuilding());
                    m.put("classroom",  a.getClassroom().getRoomName());
                    m.put("seatNumber", a.getSeatNumber());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stringNo",      student.getStudentNo());
        result.put("fullName",      student.getFullName());
        result.put("departmentName", student.getDepartment().getDepartmentName());
        result.put("facultyName",   student.getDepartment().getFaculty().getFacultyName());
        result.put("exams",         examList);
        return ResponseEntity.ok(result);
    }

    /* ─────────────────────────────────────────
       INSTRUCTOR DUTIES  (JWT required)
       ───────────────────────────────────────── */
    @GetMapping("/api/instructor/duties")
    public ResponseEntity<List<Map<String, Object>>> getMyDuties(Authentication auth) {
        if (auth == null) {
            throw new ResourceNotFoundException("Not authenticated");
        }

        String username = auth.getName();

        // Find instructor by their user account
        Instructor instructor = instructorRepository.findAll().stream()
                .filter(i -> i.getUser() != null && i.getUser().getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No instructor profile found for user: " + username));

        List<InvigilatorAssignment> assignments = invigilatorAssignmentRepository.findByInstructor(instructor);

        List<Map<String, Object>> duties = assignments.stream()
                .sorted((a, b) -> {
                    int d = a.getExam().getExamDate().compareTo(b.getExam().getExamDate());
                    return d != 0 ? d : a.getExam().getExamTime().compareTo(b.getExam().getExamTime());
                })
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("invigilationId", a.getInvigilationId());
                    m.put("examId",   a.getExam().getExamId());
                    m.put("examName", a.getExam().getExamName());
                    m.put("examDate", a.getExam().getExamDate().toString());
                    m.put("examTime", a.getExam().getExamTime().toString());
                    m.put("campus",    a.getClassroom().getCampus());
                    m.put("building",  a.getClassroom().getBuilding());
                    m.put("classroom", a.getClassroom().getRoomName());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(duties);
    }
}
