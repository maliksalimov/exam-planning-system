package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {
    List<ExamAssignment> findByExam(Exam exam);
    List<ExamAssignment> findByStudent(Student student);
    List<ExamAssignment> findByClassroom(Classroom classroom);
    Optional<ExamAssignment> findByExamAndStudent(Exam exam, Student student);
    List<ExamAssignment> findByExamAndClassroom(Exam exam, Classroom classroom);
    boolean existsByExamAndStudent(Exam exam, Student student);
    long countByExam(Exam exam);
    long countByExamAndClassroom(Exam exam, Classroom classroom);
    boolean existsByStudentAndExam_ExamDateAndExam_ExamTime(Student student, LocalDate examDate, LocalTime examTime);
    List<ExamAssignment> findByExamAndStudentIn(Exam exam, Collection<Student> students);
    List<ExamAssignment> findByStudentInAndExam_ExamDateAndExam_ExamTime(Collection<Student> students, LocalDate examDate, LocalTime examTime);
}
