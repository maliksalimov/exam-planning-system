package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.dto.ExamAssignmentCreateRequest;
import com.malik.examplanningsystem.dto.ExamAssignmentResponse;
import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.InsufficientCapacityException;
import com.malik.examplanningsystem.exception.ResourceNotFoundException;
import com.malik.examplanningsystem.repository.ExamAssignmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ExamAssignmentService {

    private final ExamAssignmentRepository examAssignmentRepository;
    private final ExamService examService;
    private final StudentService studentService;
    private final ClassroomService classroomService;

    @Transactional
    public ExamAssignmentResponse createAssignment(ExamAssignmentCreateRequest request) {
        Exam exam = examService.getExamEntityById(request.getExamId());
        Student student = studentService.getStudentEntityById(request.getStudentId());
        Classroom classroom = classroomService.getClassroomEntityById(request.getClassroomId());

        if (examAssignmentRepository.existsByExamAndStudent(exam, student)) {
            throw new DuplicateResourceException("Student is already assigned to this exam");
        }

        long seated = examAssignmentRepository.countByExamAndClassroom(exam, classroom);
        if (seated >= classroom.getCapacity()) {
            throw new InsufficientCapacityException("Classroom has reached its maximum capacity for this exam");
        }

        ExamAssignment assignment = new ExamAssignment();
        assignment.setExam(exam);
        assignment.setStudent(student);
        assignment.setClassroom(classroom);
        assignment.setSeatNumber(request.getSeatNumber());

        return convertToResponse(examAssignmentRepository.save(assignment));
    }

    public List<ExamAssignmentResponse> getAllAssignments() {
        return examAssignmentRepository.findAllWithDetails().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public ExamAssignmentResponse getAssignmentById(Long id) {
        return convertToResponse(getAssignmentEntityById(id));
    }

    public List<ExamAssignmentResponse> getAssignmentsByExam(Long examId) {
        return examAssignmentRepository.findByExamIdWithDetails(examId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<ExamAssignmentResponse> getAssignmentsByStudent(Long studentId) {
        Student student = studentService.getStudentEntityById(studentId);
        return examAssignmentRepository.findByStudent(student).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<ExamAssignmentResponse> getAssignmentsByClassroom(Long classroomId) {
        Classroom classroom = classroomService.getClassroomEntityById(classroomId);
        return examAssignmentRepository.findByClassroom(classroom).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExamAssignment createExamAssignment(Exam exam, Student student, Classroom classroom, int seatNumber) {
        ExamAssignment assignment = new ExamAssignment();
        assignment.setExam(exam);
        assignment.setStudent(student);
        assignment.setClassroom(classroom);
        assignment.setSeatNumber(seatNumber);
        return examAssignmentRepository.save(assignment);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        if (!examAssignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Exam assignment not found with id: " + id);
        }
        examAssignmentRepository.deleteById(id);
    }

    public ExamAssignment getAssignmentEntityById(Long id) {
        return examAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam assignment not found with id: " + id));
    }

    private ExamAssignmentResponse convertToResponse(ExamAssignment assignment) {
        ExamAssignmentResponse response = new ExamAssignmentResponse();
        response.setAssignmentId(assignment.getAssignmentId());
        response.setExamId(assignment.getExam().getExamId());
        response.setExamName(assignment.getExam().getExamName());
        response.setExamDate(assignment.getExam().getExamDate());
        response.setExamTime(assignment.getExam().getExamTime());
        response.setStudentId(assignment.getStudent().getStudentId());
        response.setStudentNo(assignment.getStudent().getStudentNo());
        response.setStudentName(assignment.getStudent().getFullName());
        response.setClassroomId(assignment.getClassroom().getClassroomId());
        response.setClassroomName(assignment.getClassroom().getCampus() + " - " +
                assignment.getClassroom().getBuilding() + " - " +
                assignment.getClassroom().getRoomName());
        response.setSeatNumber(assignment.getSeatNumber());
        response.setCreatedAt(assignment.getCreatedAt());
        return response;
    }
}
