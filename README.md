# SalesFlow CRM

A SaaS CRM for small/medium businesses — React 19 frontend on a real Spring Boot 3 / PostgreSQL backend, built as a Full Stack Java/React portfolio piece.

## What's real

Everything under `backend/` is a genuine, tested Spring Boot API — not a mock:

- **Auth**: JWT access tokens (15 min) + rotating, DB-backed, httpOnly-cookie refresh tokens (7 days). BCrypt passwords, register/login/refresh/logout/forgot-password/reset-password.
- **RBAC**: `ADMIN` / `SALES_MANAGER` / `SALES_AGENT` with a Spring Security role hierarchy (`ADMIN > SALES_MANAGER > SALES_AGENT`), enforced via `@PreAuthorize` and HTTP-layer matchers.
- **CRM domain**: Companies, Contacts, Leads, Deals (with the New Lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost pipeline), Tasks, Activities/Notes, all backed by PostgreSQL via Flyway migrations (no `ddl-auto`).
- **Dashboard analytics**: `/api/v1/analytics/dashboard` computes revenue, conversion rate, pipeline value (weighted + raw), monthly revenue trend, and per-agent quota attainment with real SQL aggregates.
- **Advanced features**: pagination/filtering/sorting/full-text-ish search (`pg_trgm`) on every list endpoint, optimistic UI (deal stage drag-and-drop), real file uploads (local disk, behind a swappable `FileStorageService` interface), async email via Spring Mail (MailHog in dev), an immutable audit log on every mutation, soft delete + recycle bin + admin-only permanent purge, partial/GIN indexes, and OpenAPI docs at `/swagger-ui.html`.
- **Tests**: JUnit 5 + Testcontainers (real Postgres) covering auth, RBAC, the pipeline stage transition, soft delete, and pagination/filtering — `cd backend && ./mvnw verify`.

## What's still illustrative

The **Architecture** and **Swagger API** tabs in the sidebar (`ArchitectureView.tsx`, `SwaggerApiView.tsx`) are the project's original design sketches — they render static example code rather than calling anything live. The *real* API contract is generated straight from the code at `/v3/api-docs` and `/swagger-ui.html`. AWS deployment (`.github/workflows/ci.yml`'s companion ECR/ECS YAML referenced in `architectureDocs.ts`) was never wired up or run — no cloud credentials are involved anywhere in this repo; CI only builds, tests, and sanity-builds Docker images.

## Architecture

```
React 19 + Vite  →  REST API (/api/v1)  →  Spring Boot 3 / Spring Security 6  →  PostgreSQL 16
                                                     ↓
                                        Flyway · MailHog (dev) · local file storage
```

## Running locally

**Everything at once (Docker):**

```bash
docker compose up --build
```
- Frontend: http://localhost:3001
- API: http://localhost:8080 (Swagger UI at `/swagger-ui.html`)
- MailHog UI (catches all outbound email in dev): http://localhost:8025
- Postgres: `localhost:5433`

**Backend only, for development** (needs Postgres on `5433` — `docker compose up postgres mailhog` is the easiest way to get one):

```bash
cd backend
./mvnw spring-boot:run
```

**Frontend only** (proxies `/api` to `localhost:8080` — see `vite.config.ts`):

```bash
npm install
npm run dev
```

On first boot against an empty database, `DemoDataSeeder` creates 4 demo users, 6 companies, 6 contacts, 8 deals spread across every pipeline stage, 4 leads, and 4 tasks. All seeded accounts share the password **`Passw0rd!`**:

| Email | Role |
|---|---|
| k.bennani@salesflow.ma | ADMIN |
| y.elalami@salesflow.ma | SALES_MANAGER |
| s.chraibi@salesflow.ma | SALES_AGENT |
| a.tazi@salesflow.ma | SALES_AGENT |

## Testing

```bash
cd backend && ./mvnw verify   # unit + Testcontainers integration tests
npm run lint                  # frontend type-check
npm run build                 # frontend production build
```

## CI

`.github/workflows/ci.yml` runs the backend test suite, the frontend type-check + build, and a Docker build sanity check on every push/PR to `main`. It does not push images anywhere or deploy.
