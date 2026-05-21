# transport-app/scripts/ — Operational Scripts

Standalone Node scripts. Each loads `.env` via `dotenv` and exits cleanly.

## Files

| Script | NPM target | Purpose |
|--------|------------|---------|
| `migrate.js` | `npm run migrate` | Applies any pending SQL files in `../migrations/`. Tracks applied files in a `_migrations` table. |
| `seed.js` | `npm run seed` | Creates (or updates) the first admin user. Reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `ADMIN_NAME` from the environment. |

## Adding Scripts

Drop new files in this folder and add an entry to `package.json`'s `scripts` block. Suggested follow-ups:

- `backfill-something.js` — for one-off data corrections.
- `reset-password.js` — admin tool to reset a user's password by email.
- `export-csv.js` — periodic data exports for reporting.

Each script should:

1. Load `dotenv` at the top.
2. Import the shared `pool` from `../src/config/db`.
3. Call `pool.end()` before exiting, so the process doesn't hang.
4. Exit non-zero on error so `cron` / CI can detect failures.
