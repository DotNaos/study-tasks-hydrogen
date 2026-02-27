# study-tasks-hydrogen

Minimal fullstack v1 for per-course study tasks.

## Scope (v1)

- Auth-required app (self-hosted email/password + JWT session cookie)
- Per-course tasks with exactly two sections:
	- `homework`
	- `submission`
- Task fields:
	- `title`
	- `dueDate` (optional, submissions only)
	- `done`

## Stack

- App: Next.js (TypeScript) + Tailwind + Route Handlers
- ORM: Prisma
- DB: Postgres
- Auth: Local credentials (`bcryptjs`) + signed JWT cookie (`jose`)
- Deploy/runtime: Docker Compose

## Repository layout

- `apps/web` - Next.js app (UI + API routes)
- `apps/api` - legacy FastAPI scaffold (not used in current runtime)
- `infra` - infra placeholders for future SQL/proxy scripts
- `docker-compose.yml` - local/dev/prod-style service orchestration

## Environment

1. Copy `.env.example` to `.env`
2. Set `AUTH_SECRET` to a long random string.

## Run (Docker)

```bash
docker compose up --build
```

Web: `http://localhost:3000`

## Run DB migrations

```bash
docker compose run --rm web bun run prisma:migrate
```

## Local development (without Docker)

### Web

```bash
cd apps/web
bun install
bun run prisma:generate
bun run prisma:migrate
bun run dev
```

## API endpoints (v1, Next route handlers)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/{courseId}/tasks`
- `POST /api/courses/{courseId}/tasks`
- `PATCH /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`
