package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.dto.InvigilatorAssignmentCreateRequest;
import com.malik.examplanningsystem.dto.InvigilatorAssignmentResponse;
import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.ResourceNotFoundException;
import com.malik.examplanningsystem.repository.InvigilatorAssignmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class InvigilatorAssignmentService {

    private final InvigilatorAssignmentRepository invigilatorAssignmentRepository;
    private final ExamService examService;
    private final InstructorService instructorService;
    private final ClassroomService classroomService;

    @Transactional
    public InvigilatorAssignmentResponse createAssignment(InvigilatorAssignmentCreateRequest request) {
        Exam exam = examService.getExamEntityById(request.getExamId());
        Instructor instructor = instructorService.getInstructorEntityById(request.getInstructorId());
        Classroom classroom = classroomService.getClassroomEntityById(request.getClassroomId());

        if (invigilatorAssignmentRepository.existsByExamAndInstructor(exam, instructor)) {
            throw new DuplicateResourceException("Instructor is already assigned to this exam");
        }

        if (invigilatorAssignmentRepository.existsByInstructorAndExam_ExamDateAndExam_ExamTime(
                instructor, exam.getExamDate(), exam.getExamTime())) {
            throw new DuplicateResourceException("Instructor has a conflicting invigilation assignment at this date and time");
        }

        InvigilatorAssignment assignment = new InvigilatorAssignment();
        assignment.setExam(exam);
        assignment.setInstructor(instructor);
        assignment.setClassroom(classroom);

        InvigilatorAssignment saved = invigilatorAssignmentRepository.save(assignment);
        instructorService.incrementDutyCount(request.getInstructorId());

        return convertToResponse(saved);
    }

    public List<InvigilatorAssignmentResponse> getAllAssignments() {
        return invigilatorAssignmentRepository.findAllWithDetails().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public InvigilatorAssignmentResponse getAssignmentById(Long id) {
        return convertToResponse(getAssignmentEntityById(id));
    }

    public List<InvigilatorAssignmentResponse> getAssignmentsByExam(Long examId) {
        Exam exam = examService.getExamEntityById(examId);
        return invigilatorAssignmentRepository.findByExam(exam).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<InvigilatorAssignmentResponse> getAssignmentsByInstructor(Long instructorId) {
        Instructor instructor = instructorService.getInstructorEntityById(instructorId);
        return invigilatorAssignmentRepository.findByInstructor(instructor).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<InvigilatorAssignmentResponse> getAssignmentsByClassroom(Long classroomId) {
        Classroom classroom = classroomService.getClassroomEntityById(classroomId);
        return invigilatorAssignmentRepository.findByClassroom(classroom).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvigilatorAssignment createInvigilatorAssignment(Exam exam, Instructor instructor, Classroom classroom) {
        InvigilatorAssignment assignment = new InvigilatorAssignment();
        assignment.setExam(exam);
        assignment.setInstructor(instructor);
        assignment.setClassroom(classroom);
        InvigilatorAssignment saved = invigilatorAssignmentRepository.save(assignment);
        instructorService.incrementDutyCount(instructor.getInstructorId());
        return saved;
    }

    @Transactional
    public void deleteAssignment(Long id) {
        InvigilatorAssignment assignment = getAssignmentEntityById(id);
        Long instructorId = assignment.getInstructor().getInstructorId();
        
        invigilatorAssignmentRepository.delete(assignment);
        instructorService.decrementDutyCount(instructorId);
    }

    public InvigilatorAssignment getAssignmentEntityById(Long id) {
        return invigilatorAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invigilator assignment not found with id: " + id));
    }

    private InvigilatorAssignmentResponse convertToResponse(InvigilatorAssignment assignment) {
        InvigilatorAssignmentResponse response = new InvigilatorAssignmentResponse();
        response.setInvigilationId(assignment.getInvigilationId());
        response.setExamId(assignment.getExam().getExamId());
        response.setExamName(assignment.getExam().getExamName());
        response.setExamDate(assignment.getExam().getExamDate());
        response.setExamTime(assignment.getExam().getExamTime());
        response.setInstructorId(assignment.getInstructor().getInstructorId());
        response.setInstructorStaffNo(assignment.getInstructor().getStaffNo());
        response.setInstructorName(assignment.getInstructor().getFullName());
        response.setClassroomId(assignment.getClassroom().getClassroomId());
        response.setClassroomName(assignment.getClassroom().getCampus() + " - " +
                assignment.getClassroom().getBuilding() + " - " +
                assignment.getClassroom().getRoomName());
        response.setCreatedAt(assignment.getCreatedAt());
        return response;
    }
}
