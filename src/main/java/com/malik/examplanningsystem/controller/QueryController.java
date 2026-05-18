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
 *  GET /api/student/query/{studentNo}        – student looks up exam seats by number (no auth required)
 *  GET /api/student/query/name/{fullName}    – student looks up exam seats by name  (no auth required)
 *  GET /api/instructor/duties               – instructor sees own invigilation duties (JWT required)
 */
@RestController
@AllArgsConstructor
public class QueryController {

    private final StudentRepository studentRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final InstructorRepository instructorRepository;
    private final InvigilatorAssignmentRepository invigilatorAssignmentRepository;

    /* ─────────────────────────────────────────────────────
       STUDENT QUERY BY NUMBER  (no authentication needed)
       ───────────────────────────────────────────────────── */
    @GetMapping("/api/student/query/{studentNo}")
    public ResponseEntity<Map<String, Object>> queryStudentExams(@PathVariable String studentNo) {
        Student student = studentRepository.findByStudentNo(studentNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentNo));

        List<ExamAssignment> assignments =
                examAssignmentRepository.findByStudentIdWithDetails(student.getStudentId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentNo",      student.getStudentNo());
        result.put("fullName",       student.getFullName());
        result.put("departmentName", student.getDepartment().getDepartmentName());
        result.put("facultyName",    student.getDepartment().getFaculty().getFacultyName());
        result.put("exams",          buildExamList(assignments));
        return ResponseEntity.ok(result);
    }

    /* ─────────────────────────────────────────────────────
       STUDENT QUERY BY NAME  (no authentication needed)
       ───────────────────────────────────────────────────── */
    @GetMapping("/api/student/query/name/{fullName}")
    public ResponseEntity<List<Map<String, Object>>> queryStudentExamsByName(
            @PathVariable String fullName) {

        List<Student> students = studentRepository.findByFullNameContainingIgnoreCase(fullName);
        if (students.isEmpty()) {
            throw new ResourceNotFoundException("No students found matching: " + fullName);
        }

        List<Map<String, Object>> results = students.stream().map(student -> {
            List<ExamAssignment> assignments =
                    examAssignmentRepository.findByStudentIdWithDetails(student.getStudentId());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("studentNo",      student.getStudentNo());
            result.put("fullName",       student.getFullName());
            result.put("departmentName", student.getDepartment().getDepartmentName());
            result.put("facultyName",    student.getDepartment().getFaculty().getFacultyName());
            result.put("exams",          buildExamList(assignments));
            return result;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    /* ─────────────────────────────────────────────────────
       INSTRUCTOR DUTIES  (JWT required)
       ───────────────────────────────────────────────────── */
    @GetMapping("/api/instructor/duties")
    public ResponseEntity<List<Map<String, Object>>> getMyDuties(Authentication auth) {
        if (auth == null) {
            throw new ResourceNotFoundException("Not authenticated");
        }

        String username = auth.getName();
        Instructor instructor = instructorRepository.findByUser_Username(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No instructor profile found for user: " + username));

        List<InvigilatorAssignment> assignments =
                invigilatorAssignmentRepository.findByInstructorWithDetails(instructor);

        List<Map<String, Object>> duties = assignments.stream()
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("invigilationId",   a.getInvigilationId());
                    m.put("examId",           a.getExam().getExamId());
                    m.put("examName",         a.getExam().getExamName());
                    m.put("courseName",       a.getExam().getCourse().getCourseName());
                    m.put("examDate",         a.getExam().getExamDate().toString());
                    m.put("examTime",         a.getExam().getExamTime().toString());
                    m.put("campus",           a.getClassroom().getCampus());
                    m.put("building",         a.getClassroom().getBuilding());
                    m.put("classroom",        a.getClassroom().getRoomName());
                    m.put("instructorName",   instructor.getFullName());
                    m.put("instructorStaffNo", instructor.getStaffNo());
                    m.put("studentCount",     examAssignmentRepository
                            .countByExamAndClassroom(a.getExam(), a.getClassroom()));
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(duties);
    }

    /* ─── helpers ─── */

    private List<Map<String, Object>> buildExamList(List<ExamAssignment> assignments) {
        return assignments.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("examId",     a.getExam().getExamId());
            m.put("examName",   a.getExam().getExamName());
            m.put("courseName", a.getExam().getCourse().getCourseName());
            m.put("examDate",   a.getExam().getExamDate().toString());
            m.put("examTime",   a.getExam().getExamTime().toString());
            m.put("campus",     a.getClassroom().getCampus());
            m.put("building",   a.getClassroom().getBuilding());
            m.put("classroom",  a.getClassroom().getRoomName());
            m.put("seatNumber", a.getSeatNumber());
            return m;
        }).collect(Collectors.toList());
    }
}
