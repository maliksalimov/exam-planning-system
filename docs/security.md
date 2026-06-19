# Security

## Authentication Model

The system is stateless. There are no server-side sessions. Every request must carry a signed JWT in the `Authorization: Bearer <token>` header. The server validates the token on every request via a servlet filter.

## JWT

**Library:** `io.jsonwebtoken` (JJWT)  
**Algorithm:** HMAC-SHA256 (HS256)  
**Expiry:** 24 hours (`jwt.expiration=86400000` ms)  
**Secret:** Injected via `JWT_SECRET` env var (minimum 32 characters)

The token payload contains:
- `sub` — username
- Standard `iat` (issued at) and `exp` (expiration) claims

The secret must be at least 256 bits for HS256. A suitable value can be generated with:
```bash
openssl rand -base64 48
```

## Filter Chain

`JwtAuthFilter extends OncePerRequestFilter` runs on every request before Spring Security's authorization checks.

```
Incoming request
      │
      ▼
JwtAuthFilter.doFilterInternal()
      ├── Extract "Authorization: Bearer ..." header
      ├── No header → pass through (Spring Security will reject protected routes)
      ├── Extract username from token (JwtService.extractUsername)
      ├── No existing authentication in SecurityContext →
      │     ├── Load UserDetails from DB (UserDetailsServiceImpl)
      │     ├── JwtService.isTokenValid(token, userDetails)
      │     │     ├── Verify signature
      │     │     ├── Check expiry
      │     │     └── Check token not in blacklisted_tokens table
      │     └── Set UsernamePasswordAuthenticationToken in SecurityContextHolder
      └── Pass to next filter
```

## Security Configuration — `SecurityConfig`

```
Public (no token required):
  POST /api/auth/login
  GET  /swagger-ui/**
  GET  /v3/api-docs/**
  GET  /swagger-custom.css
  GET  /  (SPA shell)
  GET  /index.html
  GET  /css/**
  GET  /js/**

Protected:
  All other /api/** → requires valid JWT
```

CSRF protection is disabled (stateless JWT API — no cookies).  
CORS is permissive in development. Restrict `allowedOrigins` in production.

## Logout & Token Blacklisting

On `POST /api/auth/logout`:
1. Extract the token from the `Authorization` header
2. Insert it into `blacklisted_tokens` with the current timestamp
3. Subsequent requests carrying that token will be rejected even if not expired

The blacklist is a PostgreSQL table — no TTL cleanup is currently implemented. In production, expired tokens should be purged periodically (tokens older than `jwt.expiration` cannot be valid regardless).

## Password Hashing

`BCryptPasswordEncoder` with default strength (10 rounds). Passwords are never stored in plaintext or logged.

## Roles

| Role | Access |
|---|---|
| `ADMIN` | Full access to all `/api/admin/**` endpoints |
| `INSTRUCTOR` | Intended for instructor-scoped views (not yet enforced at endpoint level) |
| `STUDENT` | Intended for student portal (not yet implemented) |

Currently all `/api/admin/**` routes require only authentication, not a specific role. Role-based restriction at the method level can be added with `@PreAuthorize("hasRole('ADMIN')")`.

## Security Hardening Notes

- The default admin password (`admin123`) must be changed immediately after first login in any non-demo environment.
- `JWT_SECRET` must never be committed to source control — use environment variables or a secrets manager.
- `application-local.properties` is listed in `.gitignore` and must not be committed.
- SQL injection is not possible — all queries go through JPA/JPQL with parameterized binding.
- The API returns generic error messages for auth failures (401/403) without revealing internal state.
