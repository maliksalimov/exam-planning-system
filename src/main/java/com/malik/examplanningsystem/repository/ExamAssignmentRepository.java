package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {
    @Query("SELECT ea FROM ExamAssignment ea JOIN FETCH ea.exam e JOIN FETCH e.course JOIN FETCH ea.student s JOIN FETCH s.faculty JOIN FETCH s.department JOIN FETCH ea.classroom")
    List<ExamAssignment> findAllWithDetails();

    @Query("SELECT ea FROM ExamAssignment ea JOIN FETCH ea.student s JOIN FETCH s.faculty JOIN FETCH s.department JOIN FETCH ea.classroom WHERE ea.exam.examId = :examId")
    List<ExamAssignment> findByExamIdWithDetails(@Param("examId") Long examId);

    @Query("SELECT ea.exam.examId, COUNT(ea) FROM ExamAssignment ea GROUP BY ea.exam.examId")
    List<Object[]> countStudentsPerExam();

    @Query("SELECT ea.student.studentId FROM ExamAssignment ea WHERE ea.exam.examId = :examId")
    List<Long> findStudentIdsByExamId(@Param("examId") Long examId);

    @Query("SELECT ea.student.studentId FROM ExamAssignment ea WHERE ea.exam.examDate = :date AND ea.exam.examTime = :time AND ea.exam.examId != :examId")
    List<Long> findStudentIdsWithConflictingExam(@Param("examId") Long examId, @Param("date") java.time.LocalDate date, @Param("time") java.time.LocalTime time);

    @Query("SELECT ea FROM ExamAssignment ea JOIN FETCH ea.exam e JOIN FETCH e.course JOIN FETCH ea.classroom WHERE ea.student.studentId = :studentId ORDER BY ea.exam.examDate, ea.exam.examTime")
    List<ExamAssignment> findByStudentIdWithDetails(@Param("studentId") Long studentId);

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

    @Query("SELECT a FROM ExamAssignment a JOIN FETCH a.student JOIN FETCH a.exam WHERE EXISTS (SELECT a2 FROM ExamAssignment a2 WHERE a2.student = a.student AND a2.exam.examDate = a.exam.examDate AND a2.exam.examTime = a.exam.examTime AND a2.exam.examId != a.exam.examId)")
    List<ExamAssignment> findConflictingStudentAssignments();

    @Query("SELECT a FROM ExamAssignment a JOIN FETCH a.classroom JOIN FETCH a.exam WHERE EXISTS (SELECT a2 FROM ExamAssignment a2 WHERE a2.classroom = a.classroom AND a2.exam.examDate = a.exam.examDate AND a2.exam.examTime = a.exam.examTime AND a2.exam.examId != a.exam.examId)")
    List<ExamAssignment> findConflictingClassroomAssignments();

    @Query("SELECT DISTINCT a.classroom FROM ExamAssignment a WHERE a.exam.examId != :examId AND a.exam.examDate = :date AND a.exam.examTime = :time AND a.classroom.classroomId IN :classroomIds")
    List<Classroom> findClassroomsWithConflict(@Param("examId") Long examId, @Param("date") LocalDate date, @Param("time") LocalTime time, @Param("classroomIds") Set<Long> classroomIds);
}
