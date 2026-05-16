package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface InvigilatorAssignmentRepository extends JpaRepository<InvigilatorAssignment, Long> {
    List<InvigilatorAssignment> findByExam(Exam exam);
    List<InvigilatorAssignment> findByInstructor(Instructor instructor);
    List<InvigilatorAssignment> findByClassroom(Classroom classroom);
    Optional<InvigilatorAssignment> findByExamAndInstructor(Exam exam, Instructor instructor);
    List<InvigilatorAssignment> findByExamAndClassroom(Exam exam, Classroom classroom);
    boolean existsByExamAndInstructor(Exam exam, Instructor instructor);
    boolean existsByInstructorAndExam_ExamDateAndExam_ExamTime(Instructor instructor, LocalDate examDate, LocalTime examTime);
    long countByExam(Exam exam);
    long countByExamAndClassroom(Exam exam, Classroom classroom);
    
    List<InvigilatorAssignment> findByExam_ExamDateAndExam_ExamTime(LocalDate examDate, LocalTime examTime);
    List<InvigilatorAssignment> findByExam(Exam exam); // Already exists!
}
