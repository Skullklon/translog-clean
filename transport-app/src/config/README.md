# transport-app/src/config/ — Configuration

Modules that read from `process.env` and expose ready-to-use objects.

## Files

| File | Exports | Purpose |
|------|---------|---------|
| `db.js` | `pool`, `query` | PostgreSQL connection pool (`pg.Pool`) and a thin `query(text, params)` wrapper. Reads `DATABASE_URL` or `PG*` variables. |

## Adding More Config

When you add new external dependencies (mail provider, S3, Redis, etc.), put their setup here and export configured clients. Keep `.env`/process.env access **inside** these files so the rest of the codebase can `require('./config/mailer')` and not care about env names.
