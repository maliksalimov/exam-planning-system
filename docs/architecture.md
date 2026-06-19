# Architecture

## Overview

The system follows a standard layered architecture: a Spring Boot backend exposes a REST API consumed by a single-page application served from the same origin.

```
Browser (Vanilla JS SPA)
        │  HTTP/JSON  (JWT Bearer token on every request)
        ▼
┌───────────────────────────────────────────────────┐
│  Spring Boot 3.4  (port 8081)                     │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Controllers │→ │   Services   │→ │  Repos   │ │
│  └─────────────┘  └──────────────┘  └──────────┘ │
│         ↑                                   │     │
│   JwtAuthFilter                             ▼     │
│   SecurityConfig                     PostgreSQL   │
└───────────────────────────────────────────────────┘
```

## Layers

### Controllers (`controller/`)
Thin HTTP adapters. Each controller maps to one domain resource and delegates all business logic to a service. Validation is handled by Bean Validation (`@Valid`) at the controller boundary.

| Controller | Base Path | Purpose |
|---|---|---|
| `AuthController` | `/api/auth` | Login, logout, register |
| `FacultyController` | `/api/admin/faculties` | Faculty CRUD |
| `DepartmentController` | `/api/admin/departments` | Department CRUD |
| `InstructorController` | `/api/admin/instructors` | Instructor CRUD, CSV import |
| `CourseController` | `/api/admin/courses` | Course CRUD |
| `ClassroomController` | `/api/admin/classrooms` | Classroom CRUD |
| `StudentController` | `/api/admin/students` | Student CRUD, CSV import |
| `ExamController` | `/api/admin/exams` | Exam CRUD, Excel export |
| `ExamPlanningController` | `/api/admin/exam-planning` | Planning algorithm, auto-schedule, conflicts |
| `ExamAssignmentController` | `/api/admin/exam-assignments` | View/manage student seat assignments |
| `InvigilatorAssignmentController` | `/api/admin/invigilator-assignments` | View/manage invigilator assignments |
| `QueryController` | `/api/admin/query` | Cross-entity search and analytics |
| `UserController` | `/api/admin/users` | User management |

### Services (`service/`)
All business logic lives here. Services are `@Transactional` where they write to the database. The most complex service is `ExamPlanningService` — see [Planning Algorithm](planning-algorithm.md).

### Repositories (`repository/`)
Spring Data JPA interfaces extending `JpaRepository`. Custom JPQL queries are annotated with `@Query` directly on the interface methods — no XML mapping files.

### DTOs (`dto/`)
Request and response objects are separate from JPA entities. Controllers accept `*CreateRequest` objects and return `*Response` objects, preventing accidental field exposure and decoupling the API contract from the schema.

### Entities (`entity/`)
JPA-mapped POJOs. Relationships are declared with `@ManyToOne` / `@OneToMany`. Unique constraints are enforced at the DB level via `@UniqueConstraint` on the `@Table` annotation.

## Request Lifecycle

```
1. Request arrives at JwtAuthFilter
2. Filter extracts Bearer token from Authorization header
3. JwtService validates signature + expiry + blacklist check
4. Authentication set in SecurityContextHolder
5. Spring Security checks endpoint authorization rules
6. Request dispatched to matching @RestController method
7. @Valid triggers Bean Validation on request body
8. Controller calls Service
9. Service interacts with Repositories (JPA → HikariCP → PostgreSQL)
10. Service returns domain object / throws domain exception
11. GlobalExceptionHandler converts exceptions to structured JSON error responses
12. Controller wraps result in ResponseEntity and returns
```

## Frontend (SPA)

The frontend is a hand-written Vanilla JS SPA with hash-based routing (`window.location.hash`). There are no frameworks or build tools — files are served as-is by Spring Boot's static resource handler from `src/main/resources/static/`.

```
static/
├── index.html          — single HTML shell, loads router
├── css/                — scoped component styles
└── js/
    ├── api.js          — fetch wrapper, attaches JWT, handles 401
    ├── router.js       — hash-based routing, view lifecycle (mount/unmount)
    ├── auth.js         — login state, token storage in localStorage
    ├── components/     — Navbar, CrudView, Pagination, Modal
    └── views/          — one file per route (DashboardView, StudentsView, …)
```

Each view exports a class with `getHtml()` (returns HTML string) and `mount()` (attaches event listeners, fetches data). The router calls `unmount()` on the outgoing view before rendering the next one.

## Technology Choices

| Concern | Choice | Reason |
|---|---|---|
| ORM | Spring Data JPA / Hibernate | Standard for Spring Boot; JPQL queries are portable |
| Connection pool | HikariCP | Default in Spring Boot; tuned via `application.properties` |
| Security | Spring Security 6 + JJWT | Stateless JWT; token blacklist for logout support |
| API docs | springdoc-openapi (Swagger UI) | Auto-generated from annotations; available at `/swagger-ui.html` |
| Excel export | Apache POI | `ExamController` generates `.xlsx` exam schedules |
| CSV import | OpenCSV | Student and instructor bulk upload |
| Passwords | BCryptPasswordEncoder | Strength factor default (10 rounds) |
