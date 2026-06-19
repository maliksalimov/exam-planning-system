# API Reference

All endpoints (except `/api/auth/login`) require a `Authorization: Bearer <token>` header.

Interactive documentation is available at **`http://localhost:8081/swagger-ui.html`**.

---

## Authentication — `/api/auth`

### POST `/api/auth/login`
Authenticate and receive a JWT.

**Request**
```json
{ "username": "admin", "password": "admin123" }
```
**Response 200**
```json
{ "token": "<jwt>", "username": "admin", "role": "ADMIN" }
```

### POST `/api/auth/logout`
Blacklists the current token. Requires `Authorization` header.

**Response 200** `{ "message": "Logged out successfully" }`

### POST `/api/auth/register`
Create a new user account.

**Request**
```json
{ "username": "instructor1", "password": "pass123", "role": "INSTRUCTOR" }
```

---

## Exam Planning — `/api/admin/exam-planning`

### POST `/api/admin/exam-planning/plan/{examId}`
Runs the planning algorithm for an exam.

**Path param:** `examId` — the exam to plan  
**Query param:** `dryRun=true` — simulate without writing to DB  
**Body:** Array of student IDs
```json
[1, 2, 3, 4, 5]
```

**Response 200**
```json
{
  "examId": 1,
  "examName": "Introduction to Computer Engineering Midterm",
  "examDate": "2026-07-01",
  "examTime": "09:00:00",
  "totalStudents": 5,
  "classroomsUsed": 1,
  "invigilatorsAssigned": 1,
  "dryRun": false,
  "classrooms": [
    {
      "classroom": "Main - Block A - A-101",
      "capacity": 50,
      "studentsAssigned": 5,
      "invigilatorsAssigned": 1,
      "invigilatorRule": "1–50 students → 1 invigilator",
      "studentNumbers": ["STU-0000001", "STU-0000002"],
      "invigilatorNames": ["Dr. Ali Aliyev (duties: 1)"]
    }
  ]
}
```

**Error responses**
| Code | Condition |
|---|---|
| 400 | Student already assigned to this exam |
| 400 | Student has a scheduling conflict at this date/time |
| 400 | Insufficient classroom capacity |
| 400 | Not enough available invigilators |
| 404 | Exam or student not found |

### DELETE `/api/admin/exam-planning/plan/{examId}`
Removes all student and invigilator assignments for an exam and decrements instructor duty counts.

**Response 200**
```json
{
  "examId": 1,
  "examName": "...",
  "studentAssignmentsCleared": 120,
  "invigilatorAssignmentsCleared": 3,
  "message": "Plan was reset successfully"
}
```

### POST `/api/admin/exam-planning/validate/{examId}`
Check which students can be included in planning before committing.

**Body:** Array of student IDs  
**Response 200**
```json
{
  "examId": 1,
  "conflicts": [
    {
      "studentId": 5,
      "studentNo": "STU-0000005",
      "studentName": "Ali Aliyev",
      "reason": "Already assigned to this exam"
    }
  ],
  "validStudentIds": [1, 2, 3, 4],
  "conflictCount": 1,
  "validCount": 4
}
```

### POST `/api/admin/exam-planning/auto-schedule`
Finds the first viable date+time slot and creates + plans the exam automatically.

**Request**
```json
{
  "courseId": 1,
  "studentIds": [1, 2, 3],
  "examName": "Optional custom name",
  "examType": "MIDTERM",
  "duration": 90,
  "preferredDate": "2026-07-01"
}
```
All fields except `courseId` and `studentIds` are optional.

**Response 200** — same shape as `POST /plan/{examId}` with `"autoScheduled": true` added.

### GET `/api/admin/exam-planning/conflicts`
Returns all scheduling conflicts across every exam in the system.

### GET `/api/admin/exam-planning/conflicts/{examId}`
Returns conflicts scoped to a single exam.

**Conflict types:** `STUDENT_DOUBLE_BOOKED`, `INSTRUCTOR_DOUBLE_BOOKED`, `CLASSROOM_DOUBLE_BOOKED`

---

## Exams — `/api/admin/exams`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/exams` | Paginated list. Params: `page`, `size`, `sort`, `search`, `type`, `date` |
| GET | `/api/admin/exams/{id}` | Single exam |
| POST | `/api/admin/exams` | Create exam |
| PUT | `/api/admin/exams/{id}` | Update exam |
| DELETE | `/api/admin/exams/{id}` | Delete exam |
| GET | `/api/admin/exams/{id}/export` | Download `.xlsx` schedule |

**Create/Update request**
```json
{
  "examName": "Advanced Topics in CS Final",
  "examType": "FINAL",
  "examDate": "2026-07-21",
  "examTime": "09:00:00",
  "duration": 120,
  "courseId": 1,
  "isCommonExam": false
}
```

---

## Students — `/api/admin/students`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/students` | Paginated. Params: `page`, `size`, `search`, `departmentId`, `facultyId` |
| GET | `/api/admin/students/{id}` | Single student |
| POST | `/api/admin/students` | Create student |
| PUT | `/api/admin/students/{id}` | Update student |
| DELETE | `/api/admin/students/{id}` | Delete student |
| POST | `/api/admin/students/import` | CSV bulk import (`multipart/form-data`, field `file`) |

---

## Instructors — `/api/admin/instructors`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/instructors` | Paginated. Params: `page`, `size`, `search`, `departmentId` |
| GET | `/api/admin/instructors/{id}` | Single instructor |
| POST | `/api/admin/instructors` | Create instructor |
| PUT | `/api/admin/instructors/{id}` | Update instructor |
| DELETE | `/api/admin/instructors/{id}` | Delete instructor |
| POST | `/api/admin/instructors/import` | CSV bulk import |

---

## Courses — `/api/admin/courses`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/courses` | Paginated. Params: `page`, `size`, `search`, `departmentId` |
| GET | `/api/admin/courses/{id}` | Single course |
| POST | `/api/admin/courses` | Create course |
| PUT | `/api/admin/courses/{id}` | Update course |
| DELETE | `/api/admin/courses/{id}` | Delete course |

---

## Classrooms — `/api/admin/classrooms`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/classrooms` | Paginated. Params: `page`, `size`, `search`, `campus` |
| GET | `/api/admin/classrooms/{id}` | Single classroom |
| POST | `/api/admin/classrooms` | Create classroom |
| PUT | `/api/admin/classrooms/{id}` | Update classroom |
| DELETE | `/api/admin/classrooms/{id}` | Delete classroom |

---

## Faculties & Departments

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/faculties` | All faculties (paginated) |
| POST | `/api/admin/faculties` | Create faculty |
| PUT | `/api/admin/faculties/{id}` | Update faculty |
| DELETE | `/api/admin/faculties/{id}` | Delete faculty |
| GET | `/api/admin/departments` | All departments (paginated) |
| POST | `/api/admin/departments` | Create department |
| PUT | `/api/admin/departments/{id}` | Update department |
| DELETE | `/api/admin/departments/{id}` | Delete department |

---

## Exam Assignments — `/api/admin/exam-assignments`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/exam-assignments` | All assignments (paginated, filter by `examId`) |
| GET | `/api/admin/exam-assignments/{id}` | Single assignment |
| DELETE | `/api/admin/exam-assignments/{id}` | Remove one student from an exam |

---

## Invigilator Assignments — `/api/admin/invigilator-assignments`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/invigilator-assignments` | All invigilator assignments (filter by `examId`) |
| DELETE | `/api/admin/invigilator-assignments/{id}` | Remove one invigilator assignment |

---

## Query / Analytics — `/api/admin/query`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/query/students` | Search students by name, TC no, student no |
| GET | `/api/admin/query/exams-by-date` | Exams on a given date |
| GET | `/api/admin/query/student-exam-history/{studentId}` | All exams a student is assigned to |
| GET | `/api/admin/query/instructor-workload` | Duty count ranking across all instructors |
| GET | `/api/admin/query/classroom-utilization` | Utilization stats per classroom |

---

## Pagination

All list endpoints return a standard page envelope:

```json
{
  "content": [ ... ],
  "totalElements": 10200,
  "totalPages": 204,
  "size": 50,
  "number": 0
}
```

---

## Error Responses

All errors are returned as JSON:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Exam not found with id: 99",
  "timestamp": "2026-06-10T14:30:00"
}
```

| HTTP Status | Condition |
|---|---|
| 400 | Validation failure, business rule violation, insufficient capacity |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but insufficient role |
| 404 | Requested resource does not exist |
| 409 | Duplicate resource (unique constraint) |
| 500 | Unexpected server error |
