# transport-app/ — Nexura Transportation Management System

A Node.js + Express + PostgreSQL backend for managing vehicles, drivers, and shipments, with a built-in minimal admin console served from `public/`. Designed to run behind Nginx with PM2 on Ubuntu — see `../deployment/` for the production walkthrough.

## What's Inside

```
transport-app/
├── package.json              Node project manifest
├── .env.example              Environment variable template
├── .gitignore                Excludes .env, node_modules, logs
├── ecosystem.config.js       PM2 process definition
├── server.js                 App entry point
├── migrations/
│   └── 001_init.sql          Initial database schema
├── scripts/
│   ├── migrate.js            Forward-only migration runner
│   └── seed.js               Creates the first admin user
├── src/
│   ├── config/db.js          PostgreSQL pool
│   ├── middleware/
│   │   ├── auth.js           JWT + role middleware
│   │   └── errorHandler.js   Central error JSON formatter
│   └── routes/
│       ├── auth.js           POST /register, /login
│       ├── vehicles.js       CRUD
│       ├── drivers.js        CRUD
│       └── shipments.js      CRUD + status transitions
└── public/
    └── index.html            Minimal admin console (vanilla JS)
```

## Local Setup

### 1. Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer running locally (or any reachable instance)

### 2. Install dependencies

```bash
cd transport-app
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# edit .env — at minimum, set DATABASE_URL and JWT_SECRET
# generate a strong JWT_SECRET with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Create the database

```bash
# as a postgres superuser, one-time:
createuser -P nexura                       # set a password
createdb -O nexura nexura_transport
```

### 5. Apply migrations

```bash
npm run migrate
```

### 6. Create the first admin

```bash
ADMIN_EMAIL=admin@nexorard.org ADMIN_PASSWORD='ChangeMe!Strong#123' npm run seed
```

### 7. Run

```bash
npm run dev        # node --watch, restarts on file change
# or
npm start          # plain `node server.js`
```

Then open <http://localhost:4000> and sign in with the admin you just created.

## API Reference

All endpoints under `/api/*` (except `/api/auth/login` and `/api/auth/register`) require a `Authorization: Bearer <token>` header obtained from login.

| Method | Path | Body / Notes | Role |
|--------|------|--------------|------|
| POST | `/api/auth/register` | `{email, password, name, role?}` | open (lock down before production) |
| POST | `/api/auth/login`    | `{email, password}` → `{token, user}` | open |
| GET    | `/api/vehicles`      | list | any |
| GET    | `/api/vehicles/:id`  | one | any |
| POST   | `/api/vehicles`      | `{plate, make, model, year?, status?, capacity_kg?, notes?}` | admin, dispatcher |
| PATCH  | `/api/vehicles/:id`  | partial update | admin, dispatcher |
| DELETE | `/api/vehicles/:id`  | remove | admin |
| GET    | `/api/drivers`       | list | any |
| GET    | `/api/drivers/:id`   | one | any |
| POST   | `/api/drivers`       | `{full_name, license_number, phone?, email?, status?, hired_at?, notes?}` | admin, dispatcher |
| PATCH  | `/api/drivers/:id`   | partial update | admin, dispatcher |
| DELETE | `/api/drivers/:id`   | remove | admin |
| GET    | `/api/shipments?status=` | list, optional status filter | any |
| GET    | `/api/shipments/:id` | one | any |
| POST   | `/api/shipments`     | `{reference, origin, destination, pickup_at?, deliver_by?, vehicle_id?, driver_id?, weight_kg?, value_amount?, currency?, notes?}` | admin, dispatcher |
| PATCH  | `/api/shipments/:id` | partial update; drivers may only update `status` | admin, dispatcher, driver |
| DELETE | `/api/shipments/:id` | remove | admin |
| GET    | `/healthz`           | liveness | open |
| GET    | `/readyz`            | DB readiness | open |

Shipment status flow: `pending → assigned → in_transit → delivered` (or `cancelled` at any point).

## Security Posture (Out of the Box)

- **helmet** sets sensible HTTP security headers.
- **CORS** is allow-listed (set `CORS_ORIGINS` in `.env`).
- **express-rate-limit** caps `/api/*` to 300 requests / 15 min per IP (configurable).
- **bcrypt** with cost 12 hashes all passwords.
- **JWT** secrets are loaded from env, never hard-coded; tokens expire in 12 h by default.
- **Parameterized queries** everywhere — no string interpolation into SQL.
- **No password hashes** are ever returned in API responses.
- **`trust proxy`** is on — the app expects to sit behind Nginx and honors `X-Forwarded-For`.
- **Graceful shutdown** on `SIGTERM`/`SIGINT` for clean PM2 reloads.

## Production

```bash
# On the server (after `git pull` or rsync of source):
npm ci --omit=dev
npm run migrate
pm2 start ecosystem.config.js --env production
pm2 save
```

Full walkthrough is in `../deployment/02-app-deployment.md`.

## Known Limitations (Roadmap)

These are intentional cuts to keep the skeleton small and reviewable. Tackle them in the order that matches your business priority:

- **Refresh tokens** — currently the JWT is the only auth artifact. Add a refresh token table and `/auth/refresh` for longer-lived sessions.
- **Soft delete** — `DELETE` is hard; consider adding `deleted_at` columns for audit trails.
- **File uploads** — for driver licenses, delivery photos, PODs (proof of delivery). Use S3/R2/MinIO.
- **GPS / live tracking** — accept WebSocket/MQTT pings from a driver mobile app and write to a `shipment_events` table.
- **Audit log** — record every mutation with `user_id`, `action`, `entity`, `before`, `after`.
- **Tests** — add vitest or jest. Recommended: integration tests against a disposable Postgres container.
- **OpenAPI spec** — generate one from the routes using `swagger-jsdoc` or `zod-to-openapi` to feed Postman/clients.
- **Email/Notifications** — wire SMTP (or Resend) for status notifications to customers.

## Folder Conventions

- New routes go in `src/routes/<entity>.js`.
- Long handlers should move into `src/controllers/`; shared logic into `src/services/`.
- Each new feature adds: route file, migration, README mention, CHANGELOG entry.

## Modifications Made in This Workspace

This is a fresh scaffold created on 2026-05-20. See `../CHANGELOG.md` for the full file-by-file log.
