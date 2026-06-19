# Data Model

## Entity Relationship Diagram

```
Faculty (1) ──────< Department (1) ──────< Student
                         │
                         └──────< Course (1) ──────< Exam
                         │              │                 │
                    Instructor          │        ExamAssignment
                         │         Instructor         (student + classroom + seat)
                         │                         │
                         └──────────────────── InvigilatorAssignment
                                                  (instructor + classroom)

User (standalone — authentication only)
BlacklistedToken (logout support)
Classroom (independent — assigned at planning time)
```

## Tables

### `faculties`
| Column | Type | Constraints |
|---|---|---|
| `faculty_id` | BIGINT | PK, auto-increment |
| `faculty_name` | VARCHAR(150) | NOT NULL, UNIQUE |

### `departments`
| Column | Type | Constraints |
|---|---|---|
| `department_id` | BIGINT | PK, auto-increment |
| `department_name` | VARCHAR(150) | NOT NULL |
| `faculty_id` | BIGINT | FK → faculties |

### `instructors`
| Column | Type | Constraints |
|---|---|---|
| `instructor_id` | BIGINT | PK, auto-increment |
| `staff_no` | VARCHAR(50) | NOT NULL, UNIQUE |
| `full_name` | VARCHAR(150) | NOT NULL |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE |
| `department_id` | BIGINT | FK → departments |
| `user_id` | BIGINT | FK → users (nullable) |
| `is_available_for_invigilation` | BOOLEAN | NOT NULL, default true |
| `duty_count` | INTEGER | NOT NULL, default 0 |

`duty_count` is incremented on each invigilator assignment and decremented on plan reset. The planning algorithm sorts by `duty_count ASC` to distribute workload fairly.

### `courses`
| Column | Type | Constraints |
|---|---|---|
| `course_id` | BIGINT | PK, auto-increment |
| `course_code` | VARCHAR(20) | NOT NULL, UNIQUE |
| `course_name` | VARCHAR(200) | NOT NULL |
| `semester` | VARCHAR(50) | |
| `credit_hours` | INTEGER | |
| `instructor_id` | BIGINT | FK → instructors |
| `department_id` | BIGINT | FK → departments |

### `classrooms`
| Column | Type | Constraints |
|---|---|---|
| `classroom_id` | BIGINT | PK, auto-increment |
| `campus` | VARCHAR(100) | NOT NULL |
| `building` | VARCHAR(100) | NOT NULL |
| `room_name` | VARCHAR(50) | NOT NULL, UNIQUE |
| `capacity` | INTEGER | NOT NULL |
| `is_available` | BOOLEAN | NOT NULL, default true |
| `technical_features` | VARCHAR(500) | |

Classrooms with `is_available = false` are excluded from planning entirely.

### `students`
| Column | Type | Constraints |
|---|---|---|
| `student_id` | BIGINT | PK, auto-increment |
| `student_no` | VARCHAR(50) | NOT NULL, UNIQUE |
| `tc_no` | VARCHAR(20) | NOT NULL, UNIQUE |
| `full_name` | VARCHAR(150) | NOT NULL |
| `faculty_id` | BIGINT | FK → faculties |
| `department_id` | BIGINT | FK → departments |
| `user_id` | BIGINT | FK → users (nullable) |

### `exams`
| Column | Type | Constraints |
|---|---|---|
| `exam_id` | BIGINT | PK, auto-increment |
| `exam_name` | VARCHAR(150) | NOT NULL |
| `exam_type` | VARCHAR(50) | e.g. MIDTERM, FINAL |
| `exam_date` | DATE | NOT NULL |
| `exam_time` | TIME | NOT NULL |
| `duration` | INTEGER | minutes |
| `course_id` | BIGINT | FK → courses, NOT NULL |
| `classroom_id` | BIGINT | FK → classrooms (nullable — set at planning) |
| `is_common_exam` | BOOLEAN | NOT NULL, default false |
| `created_at` | TIMESTAMP | NOT NULL, set on insert |

### `exam_assignments`
Junction table: one row per student per exam, carries the physical seat.

| Column | Type | Constraints |
|---|---|---|
| `assignment_id` | BIGINT | PK, auto-increment |
| `exam_id` | BIGINT | FK → exams, NOT NULL |
| `student_id` | BIGINT | FK → students, NOT NULL |
| `classroom_id` | BIGINT | FK → classrooms, NOT NULL |
| `seat_number` | INTEGER | sequential within classroom |
| `created_at` | TIMESTAMP | NOT NULL, set on insert |

**Unique constraint:** `(exam_id, student_id)` — a student can only be assigned to a given exam once.

### `invigilator_assignments`
Junction table: one row per instructor per exam room.

| Column | Type | Constraints |
|---|---|---|
| `invigilation_id` | BIGINT | PK, auto-increment |
| `exam_id` | BIGINT | FK → exams, NOT NULL |
| `instructor_id` | BIGINT | FK → instructors, NOT NULL |
| `classroom_id` | BIGINT | FK → classrooms, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, set on insert |

**Unique constraint:** `(exam_id, instructor_id)` — an instructor can only be assigned to a given exam once (across all rooms).

### `users`
| Column | Type | Constraints |
|---|---|---|
| `user_id` | BIGINT | PK, auto-increment |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL (BCrypt) |
| `role` | VARCHAR(20) | NOT NULL — enum: ADMIN, INSTRUCTOR, STUDENT |

### `blacklisted_tokens`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `token` | TEXT | NOT NULL |
| `blacklisted_at` | TIMESTAMP | NOT NULL |

Tokens are added here on logout. Every authenticated request checks this table to prevent reuse of valid-but-logged-out JWTs.

## Key Invariants

- A student cannot be in `exam_assignments` twice for the same exam (`UNIQUE(exam_id, student_id)`).
- A student cannot have two assignments at the same `(exam_date, exam_time)` — enforced in the service layer before writing.
- An instructor cannot invigilate two exams at the same `(exam_date, exam_time)` — enforced in the service layer.
- A classroom cannot host two exams at the same `(exam_date, exam_time)` — enforced by filtering occupied classrooms before assignment.
- Deleting a plan (reset) decrements `instructor.duty_count` for every removed invigilator assignment.
