# Planning Algorithm

The core of the system. Implemented in `ExamPlanningService`.

---

## Manual Planning — `planExam(examId, studentIds, dryRun)`

Takes an exam and a list of student IDs, distributes students across classrooms, assigns invigilators, and writes the result to the database.

### Step-by-step

```
1. LOAD
   ├── Fetch exam by ID
   └── Fetch all students by IDs (validated)

2. PRE-CONFLICT CHECK (fail fast, no writes)
   ├── Are any students already assigned to this exam?
   │   → DuplicateResourceException
   └── Do any students have another exam at (date, time)?
       → DuplicateResourceException

3. FIND FREE CLASSROOMS
   ├── Query all exams at (date, time) that have a classroom assigned
   ├── Filter those classroom IDs out of the available set
   ├── Keep only classrooms where is_available = true
   └── Sort DESC by capacity (largest rooms first)

4. CAPACITY CHECK (fail fast)
   ├── totalCapacity = sum of all available classroom capacities
   └── totalCapacity < students.size → InsufficientCapacityException

5. FIND FREE INSTRUCTORS
   ├── Already on this exam (invigilator_assignments.exam_id = examId)
   ├── Busy at (date, time) on another exam
   ├── is_available_for_invigilation = false
   └── Sort ASC by duty_count (fairness)

6. PRE-VALIDATE INVIGILATORS NEEDED (fail fast, no writes)
   ├── Simulate room fill using greedy algorithm
   ├── Sum invigilators needed across all rooms (apply invigilator rule)
   └── needed > available.size → InsufficientCapacityException with clear message

7. ASSIGN (greedy, left-to-right)
   ├── Sort students by student_no (deterministic)
   ├── For each classroom (largest → smallest):
   │   ├── Fill seats 1…capacity sequentially with next students
   │   ├── Count students placed → apply invigilator rule
   │   └── Take N instructors from available list (lowest duty first)
   └── Stop when all students placed

8. PERSIST (unless dryRun=true)
   ├── saveAll(ExamAssignment[])
   ├── saveAll(InvigilatorAssignment[])
   └── saveAll(updated Instructors) — duty_count incremented

9. RETURN summary map with classroom breakdown
```

### Invigilator Rule

| Students in room | Invigilators required |
|---|---|
| 1 – 50 | 1 |
| 51 – 100 | 2 |
| 101 + | 3 |

### Dry Run Mode

When `dryRun=true`, steps 1–7 execute normally (all validation runs) but step 8 is skipped. The response includes the full room breakdown so the user can preview the plan before committing.

---

## Validate Before Planning — `validateStudentsForPlan(examId, studentIds)`

A lighter check that returns which students have conflicts and which are eligible, without running the full algorithm. Use this to filter the student list in the UI before calling `planExam`.

**Returns:**
- `conflicts[]` — students with `reason` (`Already assigned` or `Scheduling conflict`)
- `validStudentIds[]` — IDs safe to include in planning

---

## Reset Plan — `resetExamPlan(examId)`

Reverses a plan completely:

1. Load all `ExamAssignment` rows for the exam
2. Load all `InvigilatorAssignment` rows for the exam
3. For each invigilator assignment: `instructor.dutyCount -= 1`
4. Save updated instructors
5. Delete all exam assignments
6. Delete all invigilator assignments

The duty count decrement ensures the fairness counter stays accurate when plans are reworked.

---

## Auto-Schedule — `autoScheduleExam(request)`

Finds the first viable (date, time) slot within 30 days, then creates the exam and runs `planExam`.

```
Input: courseId, studentIds, optional preferredDate, examType, duration, examName

1. Resolve course → fail if not found
2. Resolve students → fail if any not found
3. startDate = preferredDate ?? tomorrow
4. For dayOffset in 0..29:
   For timeSlot in [09:00, 11:00, 13:00, 15:00]:
     a. isSlotViable? — no student has any assignment at (date, slot)
     b. availableClassrooms at (date, slot) — enough total capacity?
     c. availableInstructors at (date, slot) — enough for the room fill?
     d. All pass → create Exam, call planExam, return result with autoScheduled=true
5. No slot found in 30 days → InsufficientCapacityException
```

The slot search is purely database-driven — no in-memory state is maintained between iterations.

---

## Conflict Detection — `detectAllConflicts()` / `detectConflicts(examId)`

Three conflict types are detected:

### STUDENT_DOUBLE_BOOKED
A student appears in `exam_assignments` for two different exams at the same `(exam_date, exam_time)`.

Detected via:  
`ExamAssignmentRepository.findConflictingStudentAssignments()` — a JPQL query that self-joins `exam_assignments` on `student_id` where `exam_date` and `exam_time` match but `exam_id` differs.

### INSTRUCTOR_DOUBLE_BOOKED
An instructor appears in `invigilator_assignments` for two different exams at the same `(exam_date, exam_time)`.

Detected via:  
`InvigilatorAssignmentRepository.findConflictingInvigilatorAssignments()`

### CLASSROOM_DOUBLE_BOOKED
A classroom hosts students from two different exams at the same `(exam_date, exam_time)`.

Detected via:  
`ExamAssignmentRepository.findConflictingClassroomAssignments()`

All three queries are implemented as `@Query` JPQL on the repository interfaces.

---

## Fairness Distribution

Instructor workload is tracked via `instructor.duty_count`. Every invocation of `planExam` increments duty counts for assigned invigilators; every `resetExamPlan` decrements them. The planning algorithm always sorts available instructors `ASC by duty_count`, so the instructor with the fewest duties is always picked first. This produces an approximately even distribution over time without requiring a separate scheduling pass.
