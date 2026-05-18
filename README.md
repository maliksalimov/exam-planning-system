# Exam Planning System

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.2-brightgreen?logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.x-blue?logo=mysql)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-stack web application for automating university exam scheduling — student seating, invigilator assignment, conflict detection, and PDF report generation — all through a browser-based admin console.

![Dashboard preview](docs/assets/dashboard-preview.png)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Maintainer](#maintainer)

---

## Features

### Core Planning Engine
- **Automated student seating** — distributes students across classrooms by capacity (largest room first), assigns sequential seat numbers
- **Invigilator auto-assignment** — allocates instructors based on duty count (fewest first) with configurable ratio:
  - 1–50 students → 1 invigilator per room
  - 51–100 students → 2 invigilators per room
  - 101+ students → 3 invigilators per room
- **Dry-run mode** — preview the full plan before saving to the database
- **Plan reset** — wipe all assignments for an exam and re-run from scratch

### Administration
- Full CRUD for all entities: faculties, departments, courses, classrooms, instructors, students, exams
- **Bulk student import** via CSV or Excel (`.csv`, `.xls`, `.xlsx`) with duplicate detection and row-level error reporting
- **Conflict detection** — identifies students or instructors double-booked at the same date and time
- Role-based access control (ADMIN / USER)

### Self-Service Portals
- **Student query** (no login required) — look up exam seat by student number
- **Instructor duties** — instructors view their assigned invigilation schedule

### Reporting
- PDF exports with embedded Times New Roman font (full Turkish character support):
  - Classroom-based exam list
  - Invigilator duty distribution sheet
  - Invigilator workload report
- All reports filtered by selected exam, not by date

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.4.2, Java 21 |
| Security | Spring Security + JWT (JJWT 0.11.5), token blacklist on logout |
| Persistence | Spring Data JPA / Hibernate, MySQL, HikariCP |
| Data import | Apache POI 5.2.3 (Excel), OpenCSV 5.7.1 |
| API docs | SpringDoc OpenAPI 2.8.0 (Swagger UI) |
| Frontend | Vanilla JS (ES6 modules), hash-based SPA routing, no framework |
| PDF | jsPDF 2.5.1 + jsPDF-AutoTable 3.8.2 |
| Build | Gradle 8 |

---

## Getting Started

### Prerequisites

- **Java 21+** — `java -version`
- **MySQL 8+** — local instance or a cloud database
- No Node.js or npm required; the frontend uses plain ES modules

### 1. Clone the repository

```bash
git clone https://github.com/maliksalimov/exam-planning-system.git
cd exam-planning-system
```

### 2. Configure the database

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/exam_planning?useSSL=false&serverTimezone=UTC
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password
```

Hibernate will create the schema automatically on first run (`ddl-auto=update`).

Also update the JWT secret if deploying beyond localhost:

```properties
jwt.secret=YourOwnSecretKeyMinimum32BytesLong
jwt.expiration=86400000   # 24 hours in milliseconds
```

### 3. Build and run

```bash
./gradlew bootRun
```

The application starts on **http://localhost:8081**.

To build a runnable JAR:

```bash
./gradlew clean build
java -jar build/libs/exam-planning-system-*.jar
```

### 4. Create the first admin user

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "changeme", "role": "ADMIN"}'
```

Then log in through the browser at **http://localhost:8081**.

---

## Usage

### Admin Console

After logging in you will see the navigation sidebar with these sections:

| Section | What you can do |
|---------|----------------|
| **Dashboard** | System-wide statistics at a glance |
| **Exam Planning** | Select an exam, choose eligible students, run the planner or preview (dry-run) |
| **Exams** | Create / edit exams; click the student count badge to view or remove assigned students |
| **Students** | CRUD + bulk import from CSV / Excel |
| **Instructors** | CRUD; duty counts update automatically after planning |
| **Courses / Classrooms / Departments / Faculties** | Reference data CRUD |
| **Conflicts** | Detect double-booked students or instructors |
| **Reports** | Download PDF reports — select an exam from the dropdown |

### Bulk student import

Prepare a file with the following header row (CSV or Excel):

```
studentNo,tcNo,fullName,facultyId,departmentId
2023001,12345678901,Ali Veli,1,3
2023002,98765432100,Ayşe Kaya,1,3
```

Upload via **Students → Import CSV/Excel**.

### Student self-service (no login)

Navigate to `#/student-query` or share the direct link. Students enter their student number to retrieve their full exam schedule with classroom and seat number.

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:8081/swagger-ui.html
```

The raw OpenAPI 3 spec is at `/v3/api-docs`.

All endpoints except `/api/auth/**`, `/api/student/query/**`, and static assets require a `Bearer` JWT token obtained from `POST /api/auth/login`.

Quick reference:

| Group | Base path |
|-------|-----------|
| Auth | `/api/auth` |
| Exam Planning | `/api/admin/exam-planning` |
| Exams | `/api/admin/exams` |
| Exam Assignments | `/api/admin/exam-assignments` |
| Invigilator Assignments | `/api/admin/invigilator-assignments` |
| Students | `/api/admin/students` |
| Instructors | `/api/admin/instructors` |
| Courses | `/api/admin/courses` |
| Classrooms | `/api/admin/classrooms` |
| Departments | `/api/admin/departments` |
| Faculties | `/api/admin/faculties` |
| Users | `/api/admin/users` |
| Public Query | `/api/student/query/**`, `/api/instructor/duties` |

See [`docs/EXAM_PLANNING_API.md`](docs/EXAM_PLANNING_API.md) for a detailed guide to the planning algorithm and Postman examples.

---

## Project Structure

```
exam-planning-system/
├── src/main/java/com/malik/examplanningsystem/
│   ├── config/          # Security, JWT filter & service
│   ├── controller/      # REST controllers (one per entity)
│   ├── dto/             # Request / response DTOs
│   ├── entity/          # JPA entities
│   ├── exception/       # Global exception handler + custom exceptions
│   ├── repository/      # Spring Data JPA repositories
│   └── service/         # Business logic (planning engine lives here)
│
├── src/main/resources/
│   ├── static/
│   │   ├── css/         # Stylesheets
│   │   ├── fonts/       # Times New Roman TTF (for PDF generation)
│   │   └── js/
│   │       ├── components/   # Navbar, CrudView base component
│   │       ├── utils/        # PdfGenerator, embedded font module
│   │       └── views/        # One JS class per page (14 views)
│   └── application.properties
│
├── docs/                # Extended documentation
├── build.gradle
└── README.md
```

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feat/my-feature`)
2. Follow the existing code style — Spring Boot conventions on the backend, plain ES6 class-based views on the frontend
3. Keep commits atomic and use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`)
4. Open a pull request against `master` with a short description of what changed and why

For large changes, open an issue first to discuss the approach.

---

## Maintainer

**Malik Salimov** — [@maliksalimov](https://github.com/maliksalimov)

For questions or bug reports, open an issue on GitHub.
