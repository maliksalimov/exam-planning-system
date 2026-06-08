# Exam Planning System

![Java 21](https://img.shields.io/badge/Java-21-blue?logo=openjdk)
![Spring Boot 3](https://img.shields.io/badge/Spring_Boot-3.4-6db33f?logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack university exam planning and management system built with **Spring Boot 3** and a **Vanilla JS SPA** frontend. It lets academic administrators schedule exams, distribute students across classrooms, auto-assign invigilators, detect scheduling conflicts, bulk-import students, and generate printable PDF reports — all from a single browser-based admin console.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Default Credentials](#default-credentials)
- [Demo Data](#demo-data)
- [API Documentation](#api-documentation)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [Contributing / Maintainer](#contributing--maintainer)

---

## Key Features

### Core Planning Engine
- **Automated student seating** — distributes students across available classrooms by capacity (largest room first), assigns sequential seat numbers per room
- **Invigilator auto-assignment** — allocates instructors based on duty count (fewest duties first) with a configurable ratio:
  - ≤ 50 students → 1 invigilator per room
  - ≤ 100 students → 2 invigilators per room
  - 101+ students → 3 invigilators per room
- **Dry-run / preview mode** — simulate the full seating plan without persisting anything
- **Plan reset** — wipe all assignments for an exam and re-run from scratch
- **Auto-scheduling** — finds the first conflict-free date/time slot (up to 30 days ahead, across 4 daily slots: 09:00, 11:00, 13:00, 15:00) for a given course and set of students, then creates and plans the exam in one step

### Conflict Detection
- **Student double-booking** — flags any student assigned to two exams at the same date and time
- **Instructor double-booking** — flags any invigilator assigned to two rooms simultaneously
- **Classroom overlap** — detects the same room used by two exams at the same time

### Administration
- Full CRUD for all entities: faculties, departments, courses, classrooms, instructors, students, exams, and users
- **Bulk student import** via CSV or Excel (`.csv`, `.xls`, `.xlsx`) — columns: `studentNo`, `tcNo`, `fullName`, `facultyId`, `departmentId`; duplicate rows are skipped with per-row error reporting
- Role-based access control (`ADMIN` / `USER`) with JWT token blacklisting on logout

### Self-Service Portals
- **Student query** (no login required) — students look up their exam seats by student number or name
- **Instructor duties** — authenticated instructors view their own invigilation schedule

### Reporting
- Client-side **PDF exports** powered by jsPDF with embedded Times New Roman font (full Unicode / Turkish character support):
  - Classroom-based seating list
  - Invigilator duty assignment sheet
  - Invigilator workload report

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Spring Boot 3.4, Spring Security, Spring Data JPA |
| Language | Java 21 |
| Database | PostgreSQL 16 |
| ORM / connection pool | Hibernate (JPA), HikariCP |
| Authentication | JWT (jjwt 0.11.5) + BCrypt, stateless sessions |
| Excel / CSV import | Apache POI 5.2.3, OpenCSV 5.7.1 |
| API documentation | SpringDoc OpenAPI 2.8 (Swagger UI) |
| Frontend | Vanilla JS ES Modules SPA — no framework, hash-based routing |
| PDF generation | jsPDF 2.5 + jsPDF-AutoTable (client-side, embedded font) |
| Build tool | Gradle 8 (wrapper included) |
| Containerisation | Docker Compose (PostgreSQL service) |

---

## Prerequisites

- **Java 21** JDK — confirm with `java -version`
- **PostgreSQL** — a running instance (local install or the provided Docker Compose file)
- **Gradle** — the included `./gradlew` wrapper is sufficient; no separate Gradle install required
- No Node.js or npm required; the frontend uses plain ES modules served by Spring Boot

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/maliksalimov/exam-planning-system.git
cd exam-planning-system
```

### 2. Start PostgreSQL (Docker option)

If you do not have a local PostgreSQL instance, use the included Docker Compose file:

```bash
docker-compose up -d
```

This starts PostgreSQL 16 on **host port 5433** with the following defaults:

| Setting | Value |
|---------|-------|
| Database | `exam_planning_system` |
| Username | `exam_user` |
| Password | `exam_password` |

### 3. Configure the application

Copy the environment template and fill in your values:

```bash
cp .env.example src/main/resources/application-local.properties
```

Edit `src/main/resources/application-local.properties`:

```properties
DB_URL=jdbc:postgresql://localhost:5433/exam_planning_system
DB_USERNAME=exam_user
DB_PASSWORD=exam_password

# Generate a strong secret — minimum 32 characters:
#   openssl rand -base64 48
JWT_SECRET=replace-with-a-secure-random-string-at-least-32-chars
```

> `application-local.properties` is listed in `.gitignore` — never commit it.

### 4. Build and run

```bash
./gradlew bootRun
```

The application starts on **http://localhost:8081**.

To produce a standalone JAR:

```bash
./gradlew clean build
java -jar build/libs/exam-planning-system-*.jar
```

### 5. Open the app

Navigate to **http://localhost:8081** in your browser and log in with the default admin credentials (see below).

---

## Configuration

All sensitive settings are supplied through environment variables defined in `application-local.properties` (or as real OS env vars in production). `application.properties` reads them via `${VAR}` interpolation.

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | JDBC connection URL for PostgreSQL | `jdbc:postgresql://localhost:5433/exam_planning_system` |
| `DB_USERNAME` | Database username | `exam_user` |
| `DB_PASSWORD` | Database password | `exam_password` |
| `JWT_SECRET` | HMAC signing secret — must be at least 32 characters | `openssl rand -base64 48` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile (default: `local`) | `prod` |

Fixed defaults in `application.properties`:

| Setting | Value |
|---------|-------|
| Server port | `8081` |
| JWT expiry | `86400000` ms (24 hours) |
| JPA DDL mode | `update` (Hibernate auto-creates / migrates schema) |
| HikariCP max pool size | `10` |

---

## Default Credentials

On first startup an admin account is created automatically:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> **Change this password immediately after your first login.**

---

## Demo Data

On first startup (empty database) the application seeds a complete realistic dataset. Subsequent restarts skip the seed if data already exists.

| Entity | Count |
|--------|-------|
| Faculties | 20 |
| Departments | 100 (5 per faculty) |
| Instructors | ~134 (1–2 per department) |
| Courses | 200 (2 per department) |
| Classrooms | 30 across 5 campuses (40–500 capacity) |
| Students | 10,200 (102 per department) |
| Exams | 40 (20 midterms + 20 finals over 10 exam days) |

---

## API Documentation

Interactive Swagger UI is available once the application is running:

```
http://localhost:8081/swagger-ui.html
```

Raw OpenAPI 3 JSON:

```
http://localhost:8081/v3/api-docs
```

All `/api/admin/**` endpoints require a `Bearer <token>` header. Obtain a token from `POST /api/auth/login`. Public endpoints (`/api/auth/**`, `/api/student/query/**`) require no authentication.

Quick endpoint reference:

| Group | Base path |
|-------|-----------|
| Auth | `/api/auth` |
| Exam Planning (algorithm) | `/api/admin/exam-planning` |
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
| Student self-service | `/api/student/query/{studentNo}` |
| Instructor duties | `/api/instructor/duties` |

---

## Docker

The `docker-compose.yml` manages the **PostgreSQL** service only. The Spring Boot application runs on the host via Gradle (or can be containerised separately).

```bash
# Start database in background
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop and remove containers (data volume is preserved)
docker-compose down
```

Data is persisted in the named Docker volume `exam_postgres_data`.

---

## Project Structure

```
exam-planning-system/
├── src/
│   ├── main/
│   │   ├── java/com/malik/examplanningsystem/
│   │   │   ├── config/          # SecurityConfig, JwtAuthFilter, DataInitializer
│   │   │   ├── controller/      # REST controllers — one per entity + planning + query
│   │   │   ├── dto/             # Request / response DTOs, PageResponse wrapper
│   │   │   ├── entity/          # JPA entities (Exam, Student, Instructor, Classroom, …)
│   │   │   ├── exception/       # Global exception handler + custom exception types
│   │   │   ├── repository/      # Spring Data JPA repositories
│   │   │   ├── security/        # JwtService, JwtAuthFilter
│   │   │   └── service/         # Business logic (planning algorithm, CSV/Excel import, …)
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── index.html        # SPA shell
│   │       │   ├── css/              # Stylesheets
│   │       │   └── js/
│   │       │       ├── views/        # 14 page components (Dashboard, ExamPlanning, …)
│   │       │       ├── components/   # Navbar
│   │       │       ├── utils/        # PdfGenerator, embedded TimesNewRoman font
│   │       │       ├── api.js        # Fetch wrapper + Toast notifications
│   │       │       ├── auth.js       # JWT storage helpers
│   │       │       └── router.js     # Hash-based client-side router
│   │       └── application.properties
│   └── test/                    # JUnit 5 + Spring Security Test + H2 in-memory DB
├── .env.example                 # Template for application-local.properties
├── build.gradle
├── docker-compose.yml
└── settings.gradle
```

---

## Contributing / Maintainer

Maintainer: **Malik Salimov** — [@maliksalimov](https://github.com/maliksalimov)

Pull requests and issues are welcome. Please open an issue first to discuss significant changes. For commits, follow the existing conventional-commit style (`feat:`, `fix:`, `refactor:`, `docs:`).
