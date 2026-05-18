package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Course;
import com.malik.examplanningsystem.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    @Query("SELECT e FROM Exam e JOIN FETCH e.course LEFT JOIN FETCH e.classroom")
    List<Exam> findAllWithDetails();

    List<Exam> findByCourse(Course course);
    List<Exam> findByClassroom(Classroom classroom);
    List<Exam> findByExamDate(LocalDate examDate);
    List<Exam> findByExamDateBetween(LocalDate startDate, LocalDate endDate);
    List<Exam> findByCourseAndExamDate(Course course, LocalDate examDate);
    boolean existsByClassroomAndExamDateAndExamTime(Classroom classroom, LocalDate examDate, LocalTime examTime);
    List<Exam> findByExamDateAndExamTime(LocalDate examDate, LocalTime examTime);
}
