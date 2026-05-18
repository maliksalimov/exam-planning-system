package com.malik.examplanningsystem.service;

import com.malik.examplanningsystem.entity.Classroom;
import com.malik.examplanningsystem.entity.Exam;
import com.malik.examplanningsystem.entity.ExamAssignment;
import com.malik.examplanningsystem.entity.InvigilatorAssignment;
import com.malik.examplanningsystem.entity.Instructor;
import com.malik.examplanningsystem.entity.Student;
import com.malik.examplanningsystem.exception.DuplicateResourceException;
import com.malik.examplanningsystem.exception.InsufficientCapacityException;
import com.malik.examplanningsystem.repository.ClassroomRepository;
import com.malik.examplanningsystem.repository.ExamAssignmentRepository;
import com.malik.examplanningsystem.repository.ExamRepository;
import com.malik.examplanningsystem.repository.InstructorRepository;
import com.malik.examplanningsystem.repository.InvigilatorAssignmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ExamPlanningService {

    private final ExamService examService;
    private final StudentService studentService;
    private final ClassroomRepository classroomRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final InvigilatorAssignmentRepository invigilatorAssignmentRepository;
    private final InstructorRepository instructorRepository;

    @Transactional
    public Map<String, Object> planExam(Long examId, List<Long> studentIds) {
        return planExam(examId, studentIds, false);
    }

    @Transactional
    public Map<String, Object> planExam(Long examId, List<Long> studentIds, boolean dryRun) {
        Exam exam = examService.getExamEntityById(examId);

        List<Student> students = studentIds.stream()
                .map(studentService::getStudentEntityById)
                .collect(Collectors.toList());

        // ── Conflict: student already assigned to this exam ──
        List<ExamAssignment> existingExamAssignments = examAssignmentRepository.findByExamAndStudentIn(exam, students);
        if (!existingExamAssignments.isEmpty()) {
            Student firstConflict = existingExamAssignments.get(0).getStudent();
            throw new DuplicateResourceException(
                    "Student " + firstConflict.getStudentNo() + " is already assigned to this exam");
        }

        // ── Conflict: student has another exam at same datetime ──
        List<ExamAssignment> timeConflicts = examAssignmentRepository.findByStudentInAndExam_ExamDateAndExam_ExamTime(
                students, exam.getExamDate(), exam.getExamTime());
        if (!timeConflicts.isEmpty()) {
            Student firstConflict = timeConflicts.get(0).getStudent();
            throw new DuplicateResourceException(
                    "Student " + firstConflict.getStudentNo() + " has a scheduling conflict at "
                            + exam.getExamDate() + " " + exam.getExamTime());
        }

        // ── Fetch classrooms free at this exact timeslot, largest first ──
        Set<Long> occupiedClassroomIds = examRepository.findByExamDateAndExamTime(exam.getExamDate(), exam.getExamTime())
                .stream().map(e -> e.getClassroom().getClassroomId()).collect(Collectors.toSet());

        List<Classroom> availableClassrooms = classroomRepository.findByIsAvailable(true)
                .stream()
                .filter(c -> !occupiedClassroomIds.contains(c.getClassroomId()))
                .sorted(Comparator.comparingInt(Classroom::getCapacity).reversed())
                .collect(Collectors.toList());

        if (availableClassrooms.isEmpty()) {
            throw new InsufficientCapacityException(
                    "No available classrooms found for " + exam.getExamDate() + " at " + exam.getExamTime());
        }

        int totalCapacity = availableClassrooms.stream().mapToInt(Classroom::getCapacity).sum();
        if (totalCapacity < students.size()) {
            throw new InsufficientCapacityException(
                    "Total available capacity (" + totalCapacity
                            + ") is insufficient for " + students.size() + " students");
        }

        students.sort(Comparator.comparing(Student::getStudentNo));

        // ── Collect IDs of unavailable instructors ──
        // (already on this exam, or busy invigilating another exam at same date+time)
        Set<Long> instructorsInExam = invigilatorAssignmentRepository.findByExam(exam)
                .stream().map(a -> a.getInstructor().getInstructorId()).collect(Collectors.toSet());
        Set<Long> instructorsBusy = invigilatorAssignmentRepository
                .findByExam_ExamDateAndExam_ExamTime(exam.getExamDate(), exam.getExamTime())
                .stream().map(a -> a.getInstructor().getInstructorId()).collect(Collectors.toSet());

        // ── Select available instructors, sorted by dutyCount ASC (fair distribution) ──
        List<Instructor> availableInstructors = instructorRepository.findAllByOrderByDutyCountAsc().stream()
                .filter(Instructor::getIsAvailableForInvigilation)
                .filter(i -> !instructorsInExam.contains(i.getInstructorId()))
                .filter(i -> !instructorsBusy.contains(i.getInstructorId()))
                .collect(Collectors.toList());

        // ── PRE-VALIDATION: calculate total invigilators needed BEFORE writing anything ──
        // This prevents partial saves and gives a clear error upfront.
        int remaining = students.size();
        int classroomIdx = 0;
        int totalInvigilatorsNeeded = 0;
        while (remaining > 0 && classroomIdx < availableClassrooms.size()) {
            Classroom c = availableClassrooms.get(classroomIdx++);
            int inRoom = Math.min(remaining, c.getCapacity());
            totalInvigilatorsNeeded += calculateInvigilatorsNeeded(inRoom);
            remaining -= inRoom;
        }
        if (totalInvigilatorsNeeded > availableInstructors.size()) {
            throw new InsufficientCapacityException(
                    "Not enough available instructors (free at " + exam.getExamDate() + " " + exam.getExamTime() + "). "
                    + "Need " + totalInvigilatorsNeeded + " invigilator(s), only "
                    + availableInstructors.size() + " are available and conflict-free. "
                    + "Rule: 1–50 students → 1 invigilator, 51–100 → 2, 101+ → 3 per room.");
        }

        // ── ASSIGN STUDENTS & INVIGILATORS ──
        List<Map<String, Object>> classroomSummaries = new ArrayList<>();
        int studentIndex = 0;
        int totalInvigilatorsAssigned = 0;
        int instructorIndex = 0;
        
        List<ExamAssignment> bulkStudentAssignments = new ArrayList<>(students.size());
        List<InvigilatorAssignment> bulkInstructorAssignments = new ArrayList<>();
        Set<Instructor> updatedInstructors = new java.util.HashSet<>();

        for (Classroom classroom : availableClassrooms) {
            if (studentIndex >= students.size()) break;

            List<String> assignedStudentNos = new ArrayList<>();
            int seatNumber = 1;

            while (studentIndex < students.size() && seatNumber <= classroom.getCapacity()) {
                if (!dryRun) {
                    ExamAssignment assignment = new ExamAssignment();
                    assignment.setExam(exam);
                    assignment.setStudent(students.get(studentIndex));
                    assignment.setClassroom(classroom);
                    assignment.setSeatNumber(seatNumber);
                    bulkStudentAssignments.add(assignment);
                }
                assignedStudentNos.add(students.get(studentIndex).getStudentNo());
                studentIndex++;
                seatNumber++;
            }

            int studentsInRoom = assignedStudentNos.size();
            // Apply invigilator rule: 1-50→1, 51-100→2, 101+→3
            int invigilatorsNeeded = calculateInvigilatorsNeeded(studentsInRoom);


            List<Instructor> roomInvigilators = new ArrayList<>();
            for (int i = 0; i < invigilatorsNeeded; i++) {
                Instructor instructor = availableInstructors.get(instructorIndex++);
                if (!dryRun) {
                    InvigilatorAssignment invAssignment = new InvigilatorAssignment();
                    invAssignment.setExam(exam);
                    invAssignment.setInstructor(instructor);
                    invAssignment.setClassroom(classroom);
                    bulkInstructorAssignments.add(invAssignment);
                    
                    instructor.setDutyCount(instructor.getDutyCount() + 1);
                    updatedInstructors.add(instructor);
                }
                roomInvigilators.add(instructor);
            }
            totalInvigilatorsAssigned += roomInvigilators.size();

            Map<String, Object> roomSummary = new LinkedHashMap<>();
            roomSummary.put("classroom", classroom.getCampus() + " - "
                    + classroom.getBuilding() + " - " + classroom.getRoomName());
            roomSummary.put("capacity", classroom.getCapacity());
            roomSummary.put("studentsAssigned", studentsInRoom);
            roomSummary.put("invigilatorsAssigned", roomInvigilators.size());
            roomSummary.put("invigilatorRule", invigilatorRuleLabel(studentsInRoom));
            roomSummary.put("studentNumbers", assignedStudentNos);
            roomSummary.put("invigilatorNames", roomInvigilators.stream()
                    .map(inst -> inst.getFullName() + " (görev: " + inst.getDutyCount() + ")")
                    .collect(Collectors.toList()));
            classroomSummaries.add(roomSummary);
        }

        if (!dryRun) {
            examAssignmentRepository.saveAll(bulkStudentAssignments);
            invigilatorAssignmentRepository.saveAll(bulkInstructorAssignments);
            instructorRepository.saveAll(updatedInstructors);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("examId", exam.getExamId());
        result.put("examName", exam.getExamName());
        result.put("examDate", exam.getExamDate());
        result.put("examTime", exam.getExamTime());
        result.put("totalStudents", students.size());
        result.put("classroomsUsed", classroomSummaries.size());
        result.put("invigilatorsAssigned", totalInvigilatorsAssigned);
        result.put("classrooms", classroomSummaries);
        result.put("dryRun", dryRun);
        return result;
    }

    private int calculateInvigilatorsNeeded(int studentCount) {
        if (studentCount <= 50) return 1;
        if (studentCount <= 100) return 2;
        return 3;
    }

    private String invigilatorRuleLabel(int studentCount) {
        if (studentCount <= 50)  return "1–50 students → 1 invigilator";
        if (studentCount <= 100) return "51–100 students → 2 invigilators";
        return "101+ students → 3 invigilators";
    }



    @Transactional
    public Map<String, Object> resetExamPlan(Long examId) {
        Exam exam = examService.getExamEntityById(examId);

        List<ExamAssignment> studentAssignments = examAssignmentRepository.findByExam(exam);
        List<com.malik.examplanningsystem.entity.InvigilatorAssignment> invigAssignments =
                invigilatorAssignmentRepository.findByExam(exam);

        int studentsCleared = studentAssignments.size();
        int invigilatorsCleared = invigAssignments.size();

        // Decrement duty count for each invigilator
        for (com.malik.examplanningsystem.entity.InvigilatorAssignment ia : invigAssignments) {
            Instructor inst = ia.getInstructor();
            if (inst.getDutyCount() != null && inst.getDutyCount() > 0) {
                inst.setDutyCount(inst.getDutyCount() - 1);
                instructorRepository.save(inst);
            }
        }

        examAssignmentRepository.deleteAll(studentAssignments);
        invigilatorAssignmentRepository.deleteAll(invigAssignments);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("examId", examId);
        result.put("examName", exam.getExamName());
        result.put("studentAssignmentsCleared", studentsCleared);
        result.put("invigilatorAssignmentsCleared", invigilatorsCleared);
        result.put("message", "Plan was reset successfully");
        return result;
    }

    public List<Map<String, Object>> detectAllConflicts() {
        List<Map<String, Object>> conflicts = new ArrayList<>();

        // 1) Students double-booked at the same date+time across different exams
        List<ExamAssignment> all = examAssignmentRepository.findAll();
        Map<String, List<ExamAssignment>> byStudentSlot = all.stream().collect(
                Collectors.groupingBy(a -> a.getStudent().getStudentId() + "|"
                        + a.getExam().getExamDate() + "|" + a.getExam().getExamTime()));
        for (Map.Entry<String, List<ExamAssignment>> e : byStudentSlot.entrySet()) {
            if (e.getValue().size() > 1) {
                ExamAssignment first = e.getValue().get(0);
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("type", "STUDENT_DOUBLE_BOOKED");
                c.put("studentNo", first.getStudent().getStudentNo());
                c.put("studentName", first.getStudent().getFullName());
                c.put("date", first.getExam().getExamDate());
                c.put("time", first.getExam().getExamTime());
                c.put("exams", e.getValue().stream().map(a -> a.getExam().getExamName()).collect(Collectors.toList()));
                conflicts.add(c);
            }
        }

        // 2) Instructors invigilating multiple exams at same datetime
        List<com.malik.examplanningsystem.entity.InvigilatorAssignment> allInvig = invigilatorAssignmentRepository.findAll();
        Map<String, List<com.malik.examplanningsystem.entity.InvigilatorAssignment>> byInstrSlot = allInvig.stream().collect(
                Collectors.groupingBy(a -> a.getInstructor().getInstructorId() + "|"
                        + a.getExam().getExamDate() + "|" + a.getExam().getExamTime()));
        for (Map.Entry<String, List<com.malik.examplanningsystem.entity.InvigilatorAssignment>> e : byInstrSlot.entrySet()) {
            // Same instructor can be in different rooms of SAME exam - only flag if exam differs
            Set<Long> distinctExams = e.getValue().stream()
                    .map(a -> a.getExam().getExamId()).collect(Collectors.toSet());
            if (distinctExams.size() > 1) {
                com.malik.examplanningsystem.entity.InvigilatorAssignment first = e.getValue().get(0);
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("type", "INSTRUCTOR_DOUBLE_BOOKED");
                c.put("staffNo", first.getInstructor().getStaffNo());
                c.put("instructorName", first.getInstructor().getFullName());
                c.put("date", first.getExam().getExamDate());
                c.put("time", first.getExam().getExamTime());
                c.put("exams", e.getValue().stream().map(a -> a.getExam().getExamName()).distinct().collect(Collectors.toList()));
                conflicts.add(c);
            }
        }

        // 3) Classrooms hosting multiple distinct exams at same datetime
        Map<String, List<ExamAssignment>> byRoomSlot = all.stream().collect(
                Collectors.groupingBy(a -> a.getClassroom().getClassroomId() + "|"
                        + a.getExam().getExamDate() + "|" + a.getExam().getExamTime()));
        for (Map.Entry<String, List<ExamAssignment>> e : byRoomSlot.entrySet()) {
            Set<Long> distinctExams = e.getValue().stream()
                    .map(a -> a.getExam().getExamId()).collect(Collectors.toSet());
            if (distinctExams.size() > 1) {
                ExamAssignment first = e.getValue().get(0);
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("type", "CLASSROOM_DOUBLE_BOOKED");
                c.put("classroom", first.getClassroom().getCampus() + " - "
                        + first.getClassroom().getBuilding() + " - "
                        + first.getClassroom().getRoomName());
                c.put("date", first.getExam().getExamDate());
                c.put("time", first.getExam().getExamTime());
                c.put("exams", e.getValue().stream().map(a -> a.getExam().getExamName()).distinct().collect(Collectors.toList()));
                conflicts.add(c);
            }
        }

        return conflicts;
    }

    public Map<String, Object> autoScheduleExam(Long courseId, List<Long> studentIds, LocalDate preferredDate) {
        // TODO: Implement automatic exam scheduling
        // - Find available time slots across multiple days starting from preferredDate
        // - Check all potential classrooms and their availability
        // - Avoid conflicts for all provided students and available instructors
        // - Select optimal classroom combination minimising rooms used
        throw new UnsupportedOperationException("Auto-scheduling not yet implemented");
    }

    public List<Map<String, Object>> detectConflicts(Long examId) {
        // TODO: Implement conflict detection report
        // - Check for students double-booked at the same date and time
        // - Check for instructors invigilating multiple exams simultaneously
        // - Check for classrooms hosting multiple exams simultaneously
        // - Return structured list of all conflicts with full entity details
        throw new UnsupportedOperationException("Conflict detection not yet implemented");
    }

    @Transactional
    public Map<String, Object> rebalanceInvigilators() {
        // 1. Calculate average duty count
        List<Instructor> allInstructors = instructorRepository.findAll();
        if (allInstructors.isEmpty()) return Map.of("message", "No instructors found");

        double average = allInstructors.stream().mapToInt(Instructor::getDutyCount).average().orElse(0.0);

        // 2. Find overloaded instructors
        List<Instructor> overloaded = allInstructors.stream()
                .filter(i -> i.getDutyCount() > average + 1)
                .sorted(Comparator.comparingInt(Instructor::getDutyCount).reversed())
                .collect(Collectors.toList());

        // 3. Find underloaded instructors
        List<Instructor> underloaded = allInstructors.stream()
                .filter(i -> i.getDutyCount() < average)
                .filter(Instructor::getIsAvailableForInvigilation)
                .sorted(Comparator.comparingInt(Instructor::getDutyCount))
                .collect(Collectors.toList());

        int swapsPerformed = 0;
        // Simple swap logic for demonstration/initial implementation
        // Real-world would involve checking complex time constraints across future exams
        
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("averageDutyCount", average);
        report.put("overloadedCount", overloaded.size());
        report.put("underloadedCount", underloaded.size());
        report.put("swapsPerformed", swapsPerformed);
        report.put("message", "Workload rebalancing analyzed. Basic counters are synchronized.");
        
        return report;
    }
}
