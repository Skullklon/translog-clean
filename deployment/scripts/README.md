# deployment/scripts/ — Server-Side Scripts

Shell scripts that run on the server. Both are idempotent — safe to re-run any time.

## Files

| Script | Run as | Cron? | Purpose |
|--------|--------|-------|---------|
| `server-bootstrap.sh` | `root` | one-shot | First-time setup of a fresh Ubuntu 22.04 VPS: packages, UFW, fail2ban, Node, Postgres, Nginx, certbot, swap, non-root user. |
| `backup-postgres.sh` | `nexura` (via cron) | nightly | `pg_dump | gzip` of the app database, with retention rotation. |

## Install on the Server

```bash
# server-bootstrap.sh runs once, right after the first SSH:
curl -fsSL https://raw.githubusercontent.com/<your-org>/<repo>/main/deployment/scripts/server-bootstrap.sh | sudo bash
# or copy it over with scp / paste into a file and run

# backup-postgres.sh becomes a cron job:
sudo cp backup-postgres.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-postgres.sh
sudo -u nexura crontab -e
#   15 3 * * * /usr/local/bin/backup-postgres.sh >> /var/log/nexura-backup.log 2>&1
```

## Customizing

Both scripts read environment variables for their tunables. Edit the script header (or set vars in the crontab line) to change:

| Variable | Default | Where |
|----------|---------|-------|
| `DB_NAME` | `nexura_transport` | `backup-postgres.sh` |
| `DB_USER` | `nexura` | `backup-postgres.sh` |
| `BACKUP_DIR` | `/var/backups/postgres` | `backup-postgres.sh` |
| `RETENTION_DAYS` | `30` | `backup-postgres.sh` |

## Verifying

After `server-bootstrap.sh`:

```bash
node --version       # v20.x
psql --version       # 16.x
nginx -v             # 1.24+
pm2 --version
sudo ufw status
sudo fail2ban-client status
```

After `backup-postgres.sh`:

```bash
ls -lh /var/backups/postgres/
# Latest file should be < 1 minute old, > 0 bytes
zcat /var/backups/postgres/$(ls -t /var/backups/postgres/ | head -1) | head -20
# Should show a "-- PostgreSQL database dump" header
```
