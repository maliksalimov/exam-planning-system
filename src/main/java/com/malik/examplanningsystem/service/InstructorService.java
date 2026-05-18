package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.dto.InstructorCreateRequest;
import com.malik.examplanningsystem.dto.InstructorResponse;
import com.malik.examplanningsystem.entity.Department;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.User;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.ResourceNotFoundException;
import com.malik.examplanningsystem.repository.InstructorRepository;
import com.malik.examplanningsystem.repository.InvigilatorAssignmentRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final InvigilatorAssignmentRepository invigilatorAssignmentRepository;
    private final DepartmentService departmentService;
    private final UserService userService;

    @Transactional
    public InstructorResponse createInstructor(InstructorCreateRequest request){
        if(instructorRepository.existsByStaffNo(request.getStaffNo())){
            throw new DuplicateResourceException("Instructor with staff number already exists");
        }

        if(instructorRepository.existsByEmail(request.getEmail())){
            throw new DuplicateResourceException(
                    "Instructor with email" + request.getEmail() + " already exist"
            );
        }

        Department department = departmentService.getDepartmentEntityById(request.getDepartmentId());

        Instructor instructor = new Instructor();
        instructor.setStaffNo(request.getStaffNo());
        instructor.setFullName(request.getFullName());
        instructor.setEmail(request.getEmail());
        instructor.setDepartment(department);
        instructor.setIsAvailableForInvigilation(request.getIsAvailableForInvigilation());
        instructor.setDutyCount(0);

        if(request.getUserId() != null){
            User user = userService.getUserById(request.getUserId());
            instructor.setUser(user);
        }

        Instructor savedInstructor = instructorRepository.save(instructor);
        return convertToResponse(savedInstructor);
    }

    public List<InstructorResponse> getAllInstructors(){
        return instructorRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public InstructorResponse getInstructorById(Long id){
        Instructor instructor = getInstructorEntityById(id);
        return convertToResponse(instructor);
    }

    public List<InstructorResponse> getInstructorsByDepartmentId(Long departmentId){
        Department department = departmentService.getDepartmentEntityById(departmentId);
        return instructorRepository.findByDepartment(department)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InstructorResponse updateInstructor(Long id, InstructorCreateRequest request){
        Instructor instructor = getInstructorEntityById(id);

        if(!instructor.getStaffNo().equals(request.getStaffNo()) && instructorRepository.existsByStaffNo(request.getStaffNo())){
            throw new DuplicateResourceException("Instructor with staff number already exists");
        }

        if(!instructor.getEmail().equals(request.getEmail()) && instructorRepository.existsByEmail(request.getEmail())){
            throw new DuplicateResourceException("Instructor with email already exists");
        }

        instructor.setStaffNo(request.getStaffNo());
        instructor.setFullName(request.getFullName());
        instructor.setEmail(request.getEmail());
        instructor.setIsAvailableForInvigilation(request.getIsAvailableForInvigilation());

        Department department = departmentService.getDepartmentEntityById(request.getDepartmentId());
        instructor.setDepartment(department);

        Instructor updatedInstructor = instructorRepository.save(instructor);
        return convertToResponse(updatedInstructor);
    }

    @Transactional
    public void deleteInstructor(Long id){
        if(!instructorRepository.existsById(id)){
            throw new ResourceNotFoundException("Instructor not found with id: " + id);
        }
        instructorRepository.deleteById(id);
    }

    @Transactional
    public void incrementDutyCount(Long id){
        Instructor instructor = getInstructorEntityById(id);
        instructor.setDutyCount(instructor.getDutyCount() + 1);
        instructorRepository.save(instructor);
    }

    @Transactional
    public void decrementDutyCount(Long id) {
        Instructor instructor = getInstructorEntityById(id);
        if (instructor.getDutyCount() > 0) {
            instructor.setDutyCount(instructor.getDutyCount() - 1);
            instructorRepository.save(instructor);
        }
    }

    @Transactional
    public void recalculateDutyCounts() {
        // This ensures the cached dutyCount field stays in sync with actual assignment records
        List<Instructor> instructors = instructorRepository.findAll();
        for (Instructor instructor : instructors) {
            long count = invigilatorAssignmentRepository.countByInstructor(instructor);
            instructor.setDutyCount((int) count);
            instructorRepository.save(instructor);
        }
    }

    private InstructorResponse convertToResponse(Instructor instructor){
        return new InstructorResponse(
                instructor.getInstructorId(),
                instructor.getStaffNo(),
                instructor.getFullName(),
                instructor.getEmail(),
                instructor.getDepartment().getDepartmentId(),
                instructor.getDepartment().getDepartmentName(),
                instructor.getDepartment().getFaculty().getFacultyId(),
                instructor.getDepartment().getFaculty().getFacultyName(),
                instructor.getIsAvailableForInvigilation(),
                instructor.getDutyCount(),
                instructor.getCreatedAt()
        );
    }

    public Instructor getInstructorEntityById(Long id){
        return instructorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found with id: " + id));
    }
}
