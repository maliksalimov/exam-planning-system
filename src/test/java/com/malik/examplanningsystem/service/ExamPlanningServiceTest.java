package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.InsufficientCapacityException;
import com.malik.examplanningsystem.repository.ClassroomRepository;
import com.malik.examplanningsystem.repository.ExamAssignmentRepository;
import com.malik.examplanningsystem.repository.ExamRepository;
import com.malik.examplanningsystem.repository.InstructorRepository;
import com.malik.examplanningsystem.repository.InvigilatorAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamPlanningServiceTest {

    @Mock private ExamService examService;
    @Mock private StudentService studentService;
    @Mock private ClassroomRepository classroomRepository;
    @Mock private ExamRepository examRepository;
    @Mock private ExamAssignmentRepository examAssignmentRepository;
    @Mock private InvigilatorAssignmentRepository invigilatorAssignmentRepository;
    @Mock private InstructorRepository instructorRepository;

    @InjectMocks
    private ExamPlanningService planningService;

    private Exam exam;
    private Classroom classroom;

    @BeforeEach
    void setUp() {
        exam = new Exam();
        exam.setExamId(1L);
        exam.setExamName("Test Exam");
        exam.setExamDate(LocalDate.of(2026, 6, 1));
        exam.setExamTime(LocalTime.of(10, 0));
        exam.setDuration(90);
        exam.setIsCommonExam(false);

        classroom = new Classroom();
        classroom.setClassroomId(1L);
        classroom.setCampus("Main");
        classroom.setBuilding("Block A");
        classroom.setRoomName("A-101");
        classroom.setCapacity(50);
        classroom.setIsAvailable(true);
    }

    // ── TEST 2: Uğurlu senaryo ────────────────────────────────────────────────

    @Test
    void planExam_successfulAssignment_savesAndReturnsCorrectSummary() {
        Student s1 = buildStudent(1L, "STU-001");
        Student s2 = buildStudent(2L, "STU-002");
        Instructor inst = buildInstructor(1L, "Dr. Test", 0);

        stubNoConflicts();
        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(studentService.getStudentEntityById(2L)).thenReturn(s2);
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));
        when(instructorRepository.findAllByOrderByDutyCountAsc()).thenReturn(List.of(inst));

        Map<String, Object> result = planningService.planExam(1L, List.of(1L, 2L));

        assertThat(result.get("totalStudents")).isEqualTo(2);
        assertThat(result.get("classroomsUsed")).isEqualTo(1);
        assertThat(result.get("invigilatorsAssigned")).isEqualTo(1);
        verify(examAssignmentRepository).saveAll(any());
        verify(invigilatorAssignmentRepository).saveAll(any());
        verify(instructorRepository).saveAll(any());
    }

    // ── TEST 5: dryRun=true heç nə saxlamır ──────────────────────────────────

    @Test
    void planExam_dryRun_doesNotWriteToDatabase() {
        Student s1 = buildStudent(1L, "STU-001");
        Instructor inst = buildInstructor(1L, "Dr. Test", 0);

        stubNoConflicts();
        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));
        when(instructorRepository.findAllByOrderByDutyCountAsc()).thenReturn(List.of(inst));

        Map<String, Object> result = planningService.planExam(1L, List.of(1L), true);

        assertThat(result.get("dryRun")).isEqualTo(true);
        verify(examAssignmentRepository, never()).saveAll(any());
        verify(invigilatorAssignmentRepository, never()).saveAll(any());
        verify(instructorRepository, never()).saveAll(any());
    }

    // ── TEST 3: Dublikat öğrenci → DuplicateResourceException ────────────────

    @Test
    void planExam_throwsDuplicateException_whenStudentAlreadyAssigned() {
        Student s1 = buildStudent(1L, "STU-001");
        ExamAssignment existing = new ExamAssignment();
        existing.setStudent(s1);

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(examAssignmentRepository.findByExamAndStudentIn(any(), any()))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> planningService.planExam(1L, List.of(1L)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("STU-001");

        verify(examAssignmentRepository, never()).saveAll(any());
    }

    // ── TEST 4a: Sınıf yoxdur → InsufficientCapacityException ────────────────

    @Test
    void planExam_throwsCapacityException_whenNoClassroomsAvailable() {
        Student s1 = buildStudent(1L, "STU-001");

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(examAssignmentRepository.findByExamAndStudentIn(any(), any()))
                .thenReturn(Collections.emptyList());
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(examRepository.findByExamDateAndExamTime(any(), any()))
                .thenReturn(Collections.emptyList());
        when(classroomRepository.findByIsAvailable(true)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> planningService.planExam(1L, List.of(1L)))
                .isInstanceOf(InsufficientCapacityException.class)
                .hasMessageContaining("No available classrooms");
    }

    // ── TEST 4b: Kapasite aşımı → InsufficientCapacityException ──────────────

    @Test
    void planExam_throwsCapacityException_whenTotalCapacityInsufficient() {
        classroom.setCapacity(1);
        Student s1 = buildStudent(1L, "STU-001");
        Student s2 = buildStudent(2L, "STU-002");

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(studentService.getStudentEntityById(2L)).thenReturn(s2);
        when(examAssignmentRepository.findByExamAndStudentIn(any(), any()))
                .thenReturn(Collections.emptyList());
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(examRepository.findByExamDateAndExamTime(any(), any()))
                .thenReturn(Collections.emptyList());
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));

        assertThatThrownBy(() -> planningService.planExam(1L, List.of(1L, 2L)))
                .isInstanceOf(InsufficientCapacityException.class)
                .hasMessageContaining("insufficient");
    }

    // ── TEST 6: Gözetmen çatışmazlığı → InsufficientCapacityException ─────────

    @Test
    void planExam_throwsCapacityException_whenNoInvigilatorsAvailable() {
        Student s1 = buildStudent(1L, "STU-001");

        stubNoConflicts();
        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));
        when(instructorRepository.findAllByOrderByDutyCountAsc()).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> planningService.planExam(1L, List.of(1L)))
                .isInstanceOf(InsufficientCapacityException.class)
                .hasMessageContaining("Not enough available instructors");
    }

    // ── TEST 1: İnvigilator kuralı — 30 öğrenci → 1 gözetmen ────────────────

    @Test
    void planExam_dryRun_30Students_assigns1Invigilator() {
        List<Student> students = buildStudents(30);
        classroom.setCapacity(50);
        Instructor inst = buildInstructor(1L, "Dr. A", 0);

        stubForBulkStudents(students, List.of(inst));

        List<Long> ids = students.stream().map(Student::getStudentId).toList();
        Map<String, Object> result = planningService.planExam(1L, ids, true);

        assertThat(result.get("invigilatorsAssigned")).isEqualTo(1);
    }

    // ── TEST 1: İnvigilator kuralı — 75 öğrenci → 2 gözetmen ────────────────

    @Test
    void planExam_dryRun_75Students_assigns2Invigilators() {
        List<Student> students = buildStudents(75);
        classroom.setCapacity(100);
        Instructor inst1 = buildInstructor(1L, "Dr. A", 0);
        Instructor inst2 = buildInstructor(2L, "Dr. B", 0);

        stubForBulkStudents(students, List.of(inst1, inst2));

        List<Long> ids = students.stream().map(Student::getStudentId).toList();
        Map<String, Object> result = planningService.planExam(1L, ids, true);

        assertThat(result.get("invigilatorsAssigned")).isEqualTo(2);
    }

    // ── TEST 1: İnvigilator kuralı — 120 öğrenci → 3 gözetmen ───────────────

    @Test
    void planExam_dryRun_120Students_assigns3Invigilators() {
        List<Student> students = buildStudents(120);
        classroom.setCapacity(150);
        Instructor inst1 = buildInstructor(1L, "Dr. A", 0);
        Instructor inst2 = buildInstructor(2L, "Dr. B", 0);
        Instructor inst3 = buildInstructor(3L, "Dr. C", 0);

        stubForBulkStudents(students, List.of(inst1, inst2, inst3));

        List<Long> ids = students.stream().map(Student::getStudentId).toList();
        Map<String, Object> result = planningService.planExam(1L, ids, true);

        assertThat(result.get("invigilatorsAssigned")).isEqualTo(3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────────────────

    private Student buildStudent(Long id, String studentNo) {
        Student s = new Student();
        s.setStudentId(id);
        s.setStudentNo(studentNo);
        return s;
    }

    private Instructor buildInstructor(Long id, String name, int dutyCount) {
        Instructor inst = new Instructor();
        inst.setInstructorId(id);
        inst.setFullName(name);
        inst.setIsAvailableForInvigilation(true);
        inst.setDutyCount(dutyCount);
        return inst;
    }

    private List<Student> buildStudents(int count) {
        List<Student> result = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            result.add(buildStudent((long) i, String.format("STU-%03d", i)));
        }
        return result;
    }

    /** Stubs common "no conflict" repository calls (used by most happy-path tests). */
    private void stubNoConflicts() {
        when(examAssignmentRepository.findByExamAndStudentIn(any(), any()))
                .thenReturn(Collections.emptyList());
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(examRepository.findByExamDateAndExamTime(any(), any()))
                .thenReturn(Collections.emptyList());
        when(invigilatorAssignmentRepository.findByExam(any()))
                .thenReturn(Collections.emptyList());
        when(invigilatorAssignmentRepository.findByExam_ExamDateAndExam_ExamTime(any(), any()))
                .thenReturn(Collections.emptyList());
    }

    /** Stubs exam + all students + classrooms + instructors for bulk student tests. */
    private void stubForBulkStudents(List<Student> students, List<Instructor> instructors) {
        when(examService.getExamEntityById(1L)).thenReturn(exam);
        for (Student s : students) {
            when(studentService.getStudentEntityById(s.getStudentId())).thenReturn(s);
        }
        stubNoConflicts();
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));
        when(instructorRepository.findAllByOrderByDutyCountAsc()).thenReturn(instructors);
    }
}
