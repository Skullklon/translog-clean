#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────
# Nightly Postgres backup for the Nexura transport app.
#
# Runs `pg_dump`, gzip-compresses the output, and rotates backups older
# than RETENTION_DAYS days.
#
# Install: sudo cp backup-postgres.sh /usr/local/bin/ && sudo chmod +x ...
# Cron:    15 3 * * * /usr/local/bin/backup-postgres.sh >> /var/log/nexura-backup.log 2>&1
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────
DB_NAME="${DB_NAME:-nexura_transport}"
DB_USER="${DB_USER:-nexura}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
# If you want this to back up via TCP instead of peer auth, set:
#   PGPASSWORD=... DB_HOST=localhost DB_PORT=5432

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] Starting backup: $OUTFILE"

# Use sudo -u postgres + peer auth by default (simplest, no password needed).
if id -u postgres >/dev/null 2>&1 && [[ -z "${PGPASSWORD:-}" ]]; then
  sudo -u postgres pg_dump --no-owner --format=plain "$DB_NAME" | gzip -9 > "$OUTFILE"
else
  pg_dump --no-owner --format=plain \
    --host="${DB_HOST:-localhost}" --port="${DB_PORT:-5432}" \
    --username="$DB_USER" "$DB_NAME" | gzip -9 > "$OUTFILE"
fi

# Sanity check: file is non-empty
if [[ ! -s "$OUTFILE" ]]; then
  echo "[$(date -Is)] ERROR: backup file is empty: $OUTFILE" >&2
  exit 1
fi

SIZE=$(du -h "$OUTFILE" | cut -f1)
echo "[$(date -Is)] OK — $SIZE → $OUTFILE"

# Rotate old backups
DELETED=$(find "$BACKUP_DIR" -type f -name "${DB_NAME}-*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
echo "[$(date -Is)] Pruned $DELETED file(s) older than $RETENTION_DAYS days"
