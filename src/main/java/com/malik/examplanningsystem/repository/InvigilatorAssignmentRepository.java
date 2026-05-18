package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface InvigilatorAssignmentRepository extends JpaRepository<InvigilatorAssignment, Long> {
    @Query("SELECT ia FROM InvigilatorAssignment ia JOIN FETCH ia.exam e JOIN FETCH e.course JOIN FETCH ia.instructor JOIN FETCH ia.classroom")
    List<InvigilatorAssignment> findAllWithDetails();

    @Query("SELECT ia FROM InvigilatorAssignment ia JOIN FETCH ia.exam e JOIN FETCH e.course JOIN FETCH ia.classroom JOIN FETCH ia.instructor WHERE ia.instructor = :instructor ORDER BY ia.exam.examDate, ia.exam.examTime")
    List<InvigilatorAssignment> findByInstructorWithDetails(@Param("instructor") Instructor instructor);

    List<InvigilatorAssignment> findByExam(Exam exam);
    List<InvigilatorAssignment> findByInstructor(Instructor instructor);
    List<InvigilatorAssignment> findByClassroom(Classroom classroom);
    Optional<InvigilatorAssignment> findByExamAndInstructor(Exam exam, Instructor instructor);
    List<InvigilatorAssignment> findByExamAndClassroom(Exam exam, Classroom classroom);
    boolean existsByExamAndInstructor(Exam exam, Instructor instructor);
    boolean existsByInstructorAndExam_ExamDateAndExam_ExamTime(Instructor instructor, LocalDate examDate, LocalTime examTime);
    long countByExam(Exam exam);
    long countByExamAndClassroom(Exam exam, Classroom classroom);
    long countByInstructor(Instructor instructor);
    
    List<InvigilatorAssignment> findByExam_ExamDateAndExam_ExamTime(LocalDate examDate, LocalTime examTime);
}

