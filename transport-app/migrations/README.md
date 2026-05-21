# transport-app/migrations/ — Database Schema Migrations

Forward-only SQL migrations applied by `scripts/migrate.js`. Each `.sql` file runs in a transaction; on failure, the transaction is rolled back and the runner exits with a non-zero status.

## Files

| File | What it does |
|------|--------------|
| `001_init.sql` | Initial schema: enables `pgcrypto`, creates `users`, `vehicles`, `drivers`, `shipments` tables with indexes. |

## Conventions

- **Numeric prefix, lexically sorted.** `001_`, `002_`, etc. The runner applies them in that order.
- **Idempotent guards** where reasonable: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. Pure `ALTER`s are fine without guards because the runner won't re-apply a file that's already in the `_migrations` ledger.
- **One concern per file.** Don't pack unrelated changes together; it makes review and rollback harder.
- **No `DROP TABLE`** in production migrations without a corresponding data-export step. If you really must drop, do it in two releases: rename first, drop later, after confirming nothing reads from it.

## Adding a Migration

```bash
# pick the next sequence number
NEXT=$(ls migrations | tail -1 | cut -c1-3)
# create a new file
touch migrations/$(printf '%03d' $((10#$NEXT + 1)))_add_routes_table.sql
```

Then write your SQL and run `npm run migrate`. The runner only applies files that haven't been recorded in the `_migrations` table — already-applied files are skipped.

## Migration Tracking

`scripts/migrate.js` creates and reads a `_migrations` table:

```sql
CREATE TABLE _migrations (
  filename TEXT PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

To force re-run a migration (e.g., in a recovery scenario):

```sql
DELETE FROM _migrations WHERE filename = '00X_foo.sql';
```

…then `npm run migrate` again. Use with care.
