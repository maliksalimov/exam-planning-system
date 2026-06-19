# Deployment

## Prerequisites

| Tool | Version |
|---|---|
| Java | 21 + |
| Gradle | Wrapper included (`./gradlew`) |
| PostgreSQL | 14 + (or Docker) |

---

## Local Development

### 1. Start PostgreSQL

**With Docker (recommended):**
```bash
docker-compose up -d db
```
This starts PostgreSQL on port **5433** with:
- Database: `exam_planning_system`
- User: `exam_user`
- Password: `exam_password`

**Without Docker:** create the database and user manually:
```sql
CREATE USER exam_user WITH PASSWORD 'exam_password';
CREATE DATABASE exam_planning_system OWNER exam_user;
```

### 2. Configure

```bash
cp .env.example src/main/resources/application-local.properties
```

The file should contain:
```properties
DB_URL=jdbc:postgresql://localhost:5433/exam_planning_system
DB_USERNAME=exam_user
DB_PASSWORD=exam_password
JWT_SECRET=<at-least-32-characters>
```

### 3. Run

```bash
./gradlew bootRun
```

The application starts on **http://localhost:8081**.

### 4. First startup

On first run, `DataInitializer` seeds the database:
- 20 faculties, 100 departments
- 134 instructors, 200 courses
- 30 classrooms, **10,200 students**, 40 exams
- Default admin: `admin` / `admin123`

Seeding is skipped on subsequent starts (guarded by `facultyRepository.count() == 0`).

---

## Docker Compose

`docker-compose.yml` defines two services:

```yaml
services:
  db:
    image: postgres:16-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: exam_planning_system
      POSTGRES_USER: exam_user
      POSTGRES_PASSWORD: exam_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    ports: ["8081:8081"]
    depends_on: [db]
    environment:
      DB_URL: jdbc:postgresql://db:5432/exam_planning_system
      DB_USERNAME: exam_user
      DB_PASSWORD: exam_password
      JWT_SECRET: ${JWT_SECRET}
```

Run full stack:
```bash
JWT_SECRET=your-secret ./docker-compose up --build
```

Run only the database (app runs locally):
```bash
docker-compose up -d db
```

---

## Building a JAR

```bash
./gradlew bootJar
# Output: build/libs/exam-planning-system-*.jar
```

Run the JAR:
```bash
java -jar build/libs/exam-planning-system-*.jar \
  --DB_URL=jdbc:postgresql://localhost:5433/exam_planning_system \
  --DB_USERNAME=exam_user \
  --DB_PASSWORD=exam_password \
  --JWT_SECRET=your-secret
```

---

## Production Checklist

- [ ] Change default admin password immediately after first login
- [ ] Set a strong, unique `JWT_SECRET` (min 32 chars, ideally 48+ from `openssl rand -base64 48`)
- [ ] Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate`; manage schema with Flyway or Liquibase
- [ ] Restrict CORS `allowedOrigins` in `SecurityConfig` to your actual frontend domain
- [ ] Put the app behind a reverse proxy (nginx / Caddy) with HTTPS
- [ ] Set up log aggregation (the app writes to stdout — capture with your platform's log driver)
- [ ] Schedule a periodic cleanup job for `blacklisted_tokens` older than 24 hours
- [ ] Set up database backups for `pgdata` volume

---

## Useful URLs

| URL | Description |
|---|---|
| `http://localhost:8081` | Application UI |
| `http://localhost:8081/swagger-ui.html` | Interactive API documentation |
| `http://localhost:8081/v3/api-docs` | Raw OpenAPI JSON |
