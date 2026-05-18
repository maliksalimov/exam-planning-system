package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.dto.StudentCreateRequest;
import com.malik.examplanningsystem.dto.StudentImportResult;
import com.malik.examplanningsystem.dto.StudentResponse;
import com.malik.examplanningsystem.entity.Department;
import com.malik.examplanningsystem.entity.Faculty;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.entity.User;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.ResourceNotFoundException;
import com.malik.examplanningsystem.repository.ExamAssignmentRepository;
import com.malik.examplanningsystem.repository.ExamRepository;
import com.malik.examplanningsystem.repository.StudentRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final FacultyService facultyService;
    private final DepartmentService departmentService;
    private final UserService userService;

    @Transactional
    public StudentResponse createStudent(StudentCreateRequest request){
        if(studentRepository.existsByStudentNo(request.getStudentNo())){
            throw new DuplicateResourceException("Student with student number already exists");
        }

        if(request.getTcNo() != null && !request.getTcNo().isEmpty()){
            if(studentRepository.existsByTcNo(request.getTcNo())){
                throw new DuplicateResourceException("Student with tc number already exists");
            }
        }

        Faculty faculty = facultyService.getFacultyEntityById(request.getFacultyId());
        Department department = departmentService.getDepartmentEntityById(request.getDepartmentId());

        Student student = new Student();
        student.setStudentNo(request.getStudentNo());
        student.setTcNo(request.getTcNo());
        student.setFullName(request.getFullName());
        student.setDepartment(department);
        student.setFaculty(faculty);

        if(request.getUserId() != null){
            User user = userService.getUserById(request.getUserId());
            student.setUser(user);
        }

        Student savedStudent = studentRepository.save(student);
        return convertToResponse(savedStudent);
    }

    public List<StudentResponse> getAllStudents(){
        return studentRepository.findAllWithDetails()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public StudentResponse getStudentById(Long id){
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        return convertToResponse(student);
    }

    public StudentResponse getStudentByStudentNo(String studentNo){
        Student student = studentRepository.findByStudentNo(studentNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with student number: " + studentNo));

        return convertToResponse(student);
    }

    public List<StudentResponse> getStudentsByDepartment(Long departmentId){
        Department department = departmentService.getDepartmentEntityById(departmentId);
        return studentRepository.findByDepartment(department)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<StudentResponse> getStudentsByFaculty(Long facultyId){
        Faculty faculty = facultyService.getFacultyEntityById(facultyId);
        return studentRepository.findByFaculty(faculty)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentCreateRequest request){
        Student student = getStudentEntityById(id);

        if(!student.getStudentNo().equals(request.getStudentNo())
                && studentRepository.existsByStudentNo(request.getStudentNo())){
            throw new DuplicateResourceException("Student with student number already exists");
        }

        if(request.getTcNo() != null && !request.getTcNo().isEmpty()){
            if(!student.getTcNo().equals(request.getTcNo())
                    && studentRepository.existsByTcNo(request.getTcNo())){
                throw new DuplicateResourceException("Student with tc number already exists");
            }
        }

        student.setStudentNo(request.getStudentNo());
        student.setTcNo(request.getTcNo());
        student.setFullName(request.getFullName());

        Faculty faculty = facultyService.getFacultyEntityById(request.getFacultyId());
        Department department = departmentService.getDepartmentEntityById(request.getDepartmentId());

        student.setFaculty(faculty);
        student.setDepartment(department);

        return convertToResponse(studentRepository.save(student));
    }

    @Transactional
    public void deleteStudent(Long id){
        if(!studentRepository.existsById(id)){
            throw new ResourceNotFoundException("Student not found with id: " + id);
        }
        studentRepository.deleteById(id);
    }

    public Student getStudentEntityById(Long id){
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    @Transactional
    public StudentImportResult importStudents(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (filename.endsWith(".csv")) {
            return importFromCsv(file);
        } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return importFromExcel(file);
        }
        throw new IllegalArgumentException("Unsupported file type. Use .csv, .xls or .xlsx");
    }

    // Expected CSV columns: studentNo, tcNo, fullName, facultyId, departmentId
    private StudentImportResult importFromCsv(MultipartFile file) throws IOException {
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            reader.readNext(); // skip header row
            String[] row;
            int lineNum = 1;
            while (true) {
                try {
                    row = reader.readNext();
                } catch (CsvValidationException e) {
                    errors.add("Line " + lineNum + ": parse error — " + e.getMessage());
                    lineNum++;
                    continue;
                }
                if (row == null) break;
                lineNum++;
                if (row.length < 5) {
                    errors.add("Line " + lineNum + ": expected 5 columns, got " + row.length);
                    skipped++;
                    continue;
                }
                String studentNo = row[0].trim();
                if (studentRepository.existsByStudentNo(studentNo)) {
                    skipped++;
                    continue;
                }
                try {
                    saveRowAsStudent(studentNo, row[1].trim(), row[2].trim(),
                            Long.parseLong(row[3].trim()), Long.parseLong(row[4].trim()));
                    imported++;
                } catch (Exception e) {
                    errors.add("Line " + lineNum + " (" + studentNo + "): " + e.getMessage());
                    skipped++;
                }
            }
        } catch (CsvValidationException e) {
            throw new IOException("Failed to read CSV: " + e.getMessage(), e);
        }
        return new StudentImportResult(imported, skipped, errors);
    }

    // Expected Excel columns (row 0 = header): studentNo, tcNo, fullName, facultyId, departmentId
    private StudentImportResult importFromExcel(MultipartFile file) throws IOException {
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String studentNo = getCellString(row, 0);
                    if (studentRepository.existsByStudentNo(studentNo)) {
                        skipped++;
                        continue;
                    }
                    String tcNo = getCellString(row, 1);
                    String fullName = getCellString(row, 2);
                    long facultyId = (long) row.getCell(3).getNumericCellValue();
                    long departmentId = (long) row.getCell(4).getNumericCellValue();
                    saveRowAsStudent(studentNo, tcNo, fullName, facultyId, departmentId);
                    imported++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                    skipped++;
                }
            }
        }
        return new StudentImportResult(imported, skipped, errors);
    }

    private void saveRowAsStudent(String studentNo, String tcNo, String fullName,
                                  long facultyId, long departmentId) {
        Faculty faculty = facultyService.getFacultyEntityById(facultyId);
        Department department = departmentService.getDepartmentEntityById(departmentId);
        Student student = new Student();
        student.setStudentNo(studentNo);
        student.setTcNo(tcNo.isEmpty() ? null : tcNo);
        student.setFullName(fullName);
        student.setFaculty(faculty);
        student.setDepartment(department);
        studentRepository.save(student);
    }

    private String getCellString(Row row, int col) {
        var cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }

    public List<StudentResponse> getEligibleStudents(Long examId, Long departmentId) {
        var exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        Set<Long> excluded = new HashSet<>(examAssignmentRepository.findStudentIdsByExamId(examId));

        List<Student> candidates;
        if (departmentId != null) {
            candidates = studentRepository.findByDepartmentIdWithDetails(departmentId);
            excluded.addAll(examAssignmentRepository.findStudentIdsWithConflictingExam(
                    examId, exam.getExamDate(), exam.getExamTime()));
        } else {
            candidates = studentRepository.findAllWithDetails();
        }

        return candidates.stream()
                .filter(s -> !excluded.contains(s.getStudentId()))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private StudentResponse convertToResponse(Student student){
        return new StudentResponse(
                student.getStudentId(),
                student.getStudentNo(),
                student.getTcNo(),
                student.getFullName(),
                student.getFaculty().getFacultyId(),
                student.getFaculty().getFacultyName(),
                student.getDepartment().getDepartmentId(),
                student.getDepartment().getDepartmentName(),
                student.getCreatedAt()
        );
    }
}
