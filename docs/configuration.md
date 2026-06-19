# Configuration

## Environment Variables

All sensitive values are injected via environment variables. The application reads them from `application-local.properties` when running with the `local` Spring profile (default).

| Variable | Required | Description | Example |
|---|---|---|---|
| `DB_URL` | Yes | Full JDBC URL to PostgreSQL | `jdbc:postgresql://localhost:5433/exam_planning_system` |
| `DB_USERNAME` | Yes | Database username | `exam_user` |
| `DB_PASSWORD` | Yes | Database password | `exam_password` |
| `JWT_SECRET` | Yes | HMAC-SHA256 signing key (min 32 chars) | `openssl rand -base64 48` |
| `SPRING_PROFILES_ACTIVE` | No | Override active profile | `prod` |

### Setting up locally

```bash
cp .env.example src/main/resources/application-local.properties
# Edit the file and fill in real values
```

`application-local.properties` is in `.gitignore` — never commit it.

---

## Application Properties

Key settings in `src/main/resources/application.properties`:

### Server
```properties
server.port=8081
spring.profiles.active=${SPRING_PROFILES_ACTIVE:local}
```

### Database
```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

`ddl-auto=update` — Hibernate applies schema changes on startup. Suitable for development. For production, switch to `validate` and manage migrations with Flyway or Liquibase.

### HikariCP Connection Pool
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
```

### Hibernate Batch Inserts
```properties
spring.jpa.properties.hibernate.jdbc.batch_size=100
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

Batch inserts are used by `DataInitializer` to seed 10,200 students efficiently. The batch size of 100 is also applied to planning operations (`saveAll` on bulk assignment lists).

### JWT
```properties
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000   # 24 hours in milliseconds
```

### Swagger / OpenAPI
```properties
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.operationsSorter=alpha
springdoc.swagger-ui.tagsSorter=alpha
springdoc.swagger-ui.docExpansion=none
springdoc.swagger-ui.filter=true
```

### Logging
```properties
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=WARN
logging.level.org.hibernate.orm.jdbc.bind=WARN
```

SQL logging is disabled by default to avoid noise. To enable during debugging:
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

---

## Spring Profiles

| Profile | Properties loaded | Use case |
|---|---|---|
| `local` (default) | `application.properties` + `application-local.properties` | Local development |
| `prod` | `application.properties` + `application-prod.properties` | Production (create this file) |

Switch profile:
```bash
SPRING_PROFILES_ACTIVE=prod ./gradlew bootRun
# or
java -jar app.jar --spring.profiles.active=prod
```

---

## build.gradle — Key Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | REST controllers, embedded Tomcat |
| `spring-boot-starter-data-jpa` | JPA / Hibernate ORM |
| `spring-boot-starter-security` | Authentication/authorization |
| `spring-boot-starter-validation` | Bean Validation (`@Valid`, `@NotNull`, etc.) |
| `postgresql` | JDBC driver |
| `jjwt-api` / `jjwt-impl` | JWT generation and validation |
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI |
| `poi-ooxml` | Apache POI — Excel export |
| `opencsv` | CSV import |
| `lombok` | Boilerplate reduction (`@Data`, `@Builder`, etc.) |
