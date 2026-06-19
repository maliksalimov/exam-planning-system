# Exam Planning System — Technical Documentation

**Version:** 1.0.0  
**Stack:** Spring Boot 3.4 · Java 21 · PostgreSQL · Vanilla JS SPA  
**Port:** 8081

---

## Contents

| Document | Description |
|---|---|
| [Architecture](architecture.md) | System layers, component diagram, request lifecycle |
| [Data Model](data-model.md) | Entity relationships, database schema, constraints |
| [API Reference](api-reference.md) | All REST endpoints with request/response shapes |
| [Planning Algorithm](planning-algorithm.md) | Core scheduling logic, conflict detection, auto-schedule |
| [Security](security.md) | JWT authentication, Spring Security filter chain |
| [Configuration](configuration.md) | Environment variables, application properties |
| [Deployment](deployment.md) | Local setup, Docker Compose, production notes |

---

## Quick Start

```bash
# 1. Start PostgreSQL (port 5433)
docker-compose up -d db

# 2. Set environment
cp .env.example src/main/resources/application-local.properties
# fill in DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET

# 3. Run
./gradlew bootRun

# 4. Open
open http://localhost:8081
# Login: admin / admin123
```

## Demo Data (seeded on first startup)

| Entity | Count |
|---|---|
| Faculties | 20 |
| Departments | 100 |
| Instructors | 134 |
| Courses | 200 |
| Classrooms | 30 |
| Students | 10,200 |
| Exams | 40 |
