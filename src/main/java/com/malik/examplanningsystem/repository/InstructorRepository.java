package com.malik.examplanningsystem.repository;

import com.malik.examplanningsystem.entity.Department;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorRepository extends JpaRepository<Instructor, Long> {

    Optional<Instructor> findByStaffNo(String staffNo);

    Optional<Instructor> findByEmail(String email);

    Optional<Instructor> findByUser(User user);

    Optional<Instructor> findByUser_Username(String username);

    List<Instructor> findByDepartment(Department department);

    List<Instructor> findByIsAvailableForInvigilationTrue();

    List<Instructor> findAllByOrderByDutyCountAsc();

    boolean existsByStaffNo(String staffNo);

    boolean existsByEmail(String email);
}
