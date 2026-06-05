package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.dto.AutoScheduleRequest;
import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Course;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.InsufficientCapacityException;
import com.malik.examplanningsystem.repository.ClassroomRepository;
import com.malik.examplanningsystem.repository.CourseRepository;
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
import java.util.Optional;

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
    @Mock private CourseRepository courseRepository;

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

    // ── planExam — dry run does not write to DB ───────────────────────────────

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

    // ── planExam — no classrooms available throws capacity error ─────────────

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

    // ── planExam — total capacity less than student count ────────────────────

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

    // ── planExam — no invigilators available throws capacity error ───────────

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

    // ── planExam — invigilator rule: 1–50 students → 1 invigilator ──────────

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

    // ── planExam — invigilator rule: 51–100 students → 2 invigilators ────────

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

    // ── planExam — invigilator rule: 101+ students → 3 invigilators ──────────

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

    // ── detectConflicts — no assignments returns empty list ───────────────────

    @Test
    void detectConflicts_noAssignments_returnsEmptyList() {
        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(examAssignmentRepository.findByExam(exam)).thenReturn(Collections.emptyList());

        List<Map<String, Object>> result = planningService.detectConflicts(1L);

        assertThat(result).isEmpty();
    }

    // ── detectConflicts — student double-booked at same timeslot ─────────────

    @Test
    void detectConflicts_studentDoubleBooked_returnsConflict() {
        Student student = buildStudent(1L, "STU-001");

        ExamAssignment myAssignment = new ExamAssignment();
        myAssignment.setStudent(student);
        myAssignment.setExam(exam);
        myAssignment.setClassroom(classroom);

        Exam otherExam = new Exam();
        otherExam.setExamId(2L);
        otherExam.setExamName("Other Exam");
        otherExam.setExamDate(exam.getExamDate());
        otherExam.setExamTime(exam.getExamTime());

        ExamAssignment conflictingAssignment = new ExamAssignment();
        conflictingAssignment.setStudent(student);
        conflictingAssignment.setExam(otherExam);
        conflictingAssignment.setClassroom(classroom);

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(examAssignmentRepository.findByExam(exam)).thenReturn(List.of(myAssignment));
        // First call: student double-booked check — return the conflicting assignment.
        // Second call: classroom double-booked check (empty student list from findAll) — return empty.
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(List.of(conflictingAssignment))
                .thenReturn(Collections.emptyList());
        when(invigilatorAssignmentRepository.findByExam(exam)).thenReturn(Collections.emptyList());
        when(examAssignmentRepository.findAll()).thenReturn(Collections.emptyList());

        List<Map<String, Object>> result = planningService.detectConflicts(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("type")).isEqualTo("STUDENT_DOUBLE_BOOKED");
        assertThat(result.get(0).get("studentNo")).isEqualTo("STU-001");
    }

    // ── detectConflicts — no conflicts returns empty list ─────────────────────

    @Test
    void detectConflicts_noConflicts_returnsEmptyList() {
        Student student = buildStudent(1L, "STU-001");

        ExamAssignment assignment = new ExamAssignment();
        assignment.setStudent(student);
        assignment.setExam(exam);
        assignment.setClassroom(classroom);

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(examAssignmentRepository.findByExam(exam)).thenReturn(List.of(assignment));
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(invigilatorAssignmentRepository.findByExam(exam)).thenReturn(Collections.emptyList());
        when(examAssignmentRepository.findAll()).thenReturn(Collections.emptyList());

        List<Map<String, Object>> result = planningService.detectConflicts(1L);

        assertThat(result).isEmpty();
    }

    // ── autoScheduleExam — finds first viable slot and plans exam ─────────────

    @Test
    void autoScheduleExam_findsFirstAvailableSlot_createsAndPlansExam() {
        Course course = new Course();
        course.setCourseId(10L);
        course.setCourseName("Mathematics");

        Student s1 = buildStudent(1L, "STU-001");
        Instructor inst = buildInstructor(1L, "Dr. A", 0);

        Exam savedExam = new Exam();
        savedExam.setExamId(99L);
        savedExam.setExamName("Mathematics Exam");
        savedExam.setExamDate(LocalDate.now().plusDays(1));
        savedExam.setExamTime(LocalTime.of(9, 0));
        savedExam.setDuration(90);
        savedExam.setIsCommonExam(false);
        savedExam.setCourse(course);

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        // No student conflicts at the first slot
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(examRepository.findByExamDateAndExamTime(any(), any())).thenReturn(Collections.emptyList());
        when(classroomRepository.findByIsAvailable(true)).thenReturn(List.of(classroom));
        when(invigilatorAssignmentRepository.findByExam_ExamDateAndExam_ExamTime(any(), any()))
                .thenReturn(Collections.emptyList());
        when(instructorRepository.findAllByOrderByDutyCountAsc()).thenReturn(List.of(inst));
        when(examRepository.save(any())).thenReturn(savedExam);
        // planExam calls:
        when(examService.getExamEntityById(99L)).thenReturn(savedExam);
        when(examAssignmentRepository.findByExamAndStudentIn(any(), any())).thenReturn(Collections.emptyList());
        when(invigilatorAssignmentRepository.findByExam(any())).thenReturn(Collections.emptyList());

        AutoScheduleRequest request = new AutoScheduleRequest();
        request.setCourseId(10L);
        request.setStudentIds(List.of(1L));
        request.setPreferredDate(LocalDate.now().plusDays(1));

        Map<String, Object> result = planningService.autoScheduleExam(request);

        assertThat(result).containsKey("examId");
        assertThat(result.get("autoScheduled")).isEqualTo(true);
        verify(examRepository).save(any());
    }

    // ── autoScheduleExam — no viable slot in 30 days throws exception ─────────

    @Test
    void autoScheduleExam_noSlotIn30Days_throwsInsufficientCapacityException() {
        Course course = new Course();
        course.setCourseId(10L);
        course.setCourseName("Mathematics");

        Student s1 = buildStudent(1L, "STU-001");

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(studentService.getStudentEntityById(1L)).thenReturn(s1);
        // Every slot has a student conflict
        ExamAssignment blockingAssignment = new ExamAssignment();
        blockingAssignment.setStudent(s1);
        blockingAssignment.setExam(exam);
        blockingAssignment.setClassroom(classroom);
        when(examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(any(), any(), any()))
                .thenReturn(List.of(blockingAssignment));

        AutoScheduleRequest request = new AutoScheduleRequest();
        request.setCourseId(10L);
        request.setStudentIds(List.of(1L));
        request.setPreferredDate(LocalDate.now().plusDays(1));

        assertThatThrownBy(() -> planningService.autoScheduleExam(request))
                .isInstanceOf(InsufficientCapacityException.class)
                .hasMessageContaining("No available slot found");
    }

    // ── resetExamPlan — clears assignments and decrements invigilator duties ──

    @Test
    void resetExamPlan_clearsAllAssignmentsAndDecrementsInvigilatorDuties() {
        Student s1 = buildStudent(1L, "STU-001");
        ExamAssignment ea = new ExamAssignment();
        ea.setStudent(s1);
        ea.setExam(exam);
        ea.setClassroom(classroom);

        Instructor inst = buildInstructor(1L, "Dr. A", 3);
        InvigilatorAssignment ia = new InvigilatorAssignment();
        ia.setInstructor(inst);
        ia.setExam(exam);
        ia.setClassroom(classroom);

        when(examService.getExamEntityById(1L)).thenReturn(exam);
        when(examAssignmentRepository.findByExam(exam)).thenReturn(List.of(ea));
        when(invigilatorAssignmentRepository.findByExam(exam)).thenReturn(List.of(ia));

        Map<String, Object> result = planningService.resetExamPlan(1L);

        assertThat(result.get("studentAssignmentsCleared")).isEqualTo(1);
        assertThat(result.get("invigilatorAssignmentsCleared")).isEqualTo(1);
        assertThat(inst.getDutyCount()).isEqualTo(2);
        verify(examAssignmentRepository).deleteAll(any());
        verify(invigilatorAssignmentRepository).deleteAll(any());
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

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
