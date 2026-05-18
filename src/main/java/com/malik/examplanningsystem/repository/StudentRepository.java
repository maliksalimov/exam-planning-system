package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Department;
import com.malik.examplanningsystem.entity.Faculty;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query("SELECT s FROM Student s JOIN FETCH s.faculty JOIN FETCH s.department")
    List<Student> findAllWithDetails();

    Optional<Student> findByStudentNo(String studentId);

    Optional<Student> findByTcNo(String tcNo);

    Optional<Student> findByUser(User user);

    List<Student> findByDepartment(Department department);

    @Query("SELECT s FROM Student s JOIN FETCH s.faculty JOIN FETCH s.department WHERE s.department.departmentId = :departmentId")
    List<Student> findByDepartmentIdWithDetails(@Param("departmentId") Long departmentId);

    List<Student> findByFaculty(Faculty faculty);

    boolean existsByStudentNo(String studentId);

    boolean existsByTcNo(String tcNo);

    List<Student> findByFullNameContainingIgnoreCase(String name);
}
