# 04 · Backups & Monitoring

Backups you've never restored aren't backups. Monitoring you've never tested isn't monitoring. This file covers both — and walks through verifying each.

## 4.1 — Nightly Database Backups

A backup script lives at `scripts/backup-postgres.sh`. It runs `pg_dump`, gzips the result, and rotates old files. Install it:

```bash
sudo mkdir -p /var/backups/postgres
sudo chown nexura:nexura /var/backups/postgres
sudo cp /srv/nexura/deployment/scripts/backup-postgres.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-postgres.sh
```

Schedule it via cron (as `nexura`):

```bash
crontab -e
```

Add:

```
# Nightly Postgres backup at 03:15 server time
15 3 * * * /usr/local/bin/backup-postgres.sh >> /var/log/nexura-backup.log 2>&1
```

Test it now:

```bash
sudo -u nexura /usr/local/bin/backup-postgres.sh
ls -lh /var/backups/postgres/
```

You should see a `nexura_transport-YYYYMMDD-HHMMSS.sql.gz` file.

## 4.2 — Off-Site Backups

A backup on the same machine that holds the production DB protects against software bugs but not disk failure or a compromised host. Push the file off the box.

### Option A — Provider object storage (recommended)

If your VPS provider has S3-compatible storage (DigitalOcean Spaces, Hetzner Object Storage, Vultr Object Storage, Backblaze B2), install `rclone`:

```bash
sudo apt install -y rclone
rclone config            # interactive — set up remote named "offsite"
```

Add this to your cron line:

```
15 3 * * * /usr/local/bin/backup-postgres.sh && rclone copy /var/backups/postgres offsite:nexura-backups --max-age 36h >> /var/log/nexura-backup.log 2>&1
```

### Option B — Encrypted scp to another box

```bash
# nightly: copy newest backup to a second VPS or NAS
0 4 * * * scp $(ls -t /var/backups/postgres/*.gz | head -1) backup@<other-host>:/var/backups/nexura/
```

Whatever you choose, **test the restore quarterly**:

```bash
# 1. Pull a recent backup
zcat /var/backups/postgres/nexura_transport-XXXXX.sql.gz > /tmp/restore.sql

# 2. Restore into a scratch database
sudo -u postgres createdb restore_test
sudo -u postgres psql -d restore_test < /tmp/restore.sql

# 3. Eyeball it
sudo -u postgres psql -d restore_test -c "SELECT count(*) FROM users;"

# 4. Tear down
sudo -u postgres dropdb restore_test
```

## 4.3 — Application Logs

PM2 already rotates via `pm2-logrotate` (see `02-app-deployment.md` §2.11). Locations:

| Log | Path |
|-----|------|
| App stdout | `/srv/nexura/transport-app/logs/out.log` |
| App stderr | `/srv/nexura/transport-app/logs/error.log` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log` |
| System | `journalctl -u nginx`, `journalctl -u postgresql` |

To tail everything together for live debugging:

```bash
sudo tail -F /var/log/nginx/error.log /srv/nexura/transport-app/logs/error.log
```

## 4.4 — Uptime Monitoring (free options)

Pick one — they all do basically the same thing.

| Service | Free tier | Notes |
|---------|-----------|-------|
| **UptimeRobot** | 50 monitors, 5-min interval | Easiest setup. |
| **BetterStack (Better Uptime)** | 10 monitors, 30-second interval | Nicer UI, status pages. |
| **Healthchecks.io** | 20 checks, free | Pull-based: server *pings* it. Great for cron jobs. |
| **Hetzner Status / DO Monitoring** | Built into VPS dashboards | CPU/RAM/disk alerts. |

Add **these monitors at minimum**:

1. `GET https://nexorard.org/` — expects HTTP 200.
2. `GET https://app.nexorard.org/healthz` — expects `{"status":"ok"}`.
3. `GET https://app.nexorard.org/readyz` — expects HTTP 200 (this catches DB outages).
4. **SSL expiration** — every monitor service has a built-in cert checker.

Wire alerts to **email + WhatsApp/SMS** (most services support it via Twilio or built-in).

## 4.5 — Server Resource Alerts

Even with uptime checks, you want to know about resource exhaustion *before* the site goes down. Two lightweight options:

### Option A — Provider-built-in (easiest)

DigitalOcean, Hetzner, and Vultr all let you set alerts on CPU, RAM, disk, and bandwidth from the dashboard. Set:

- CPU > 80% for 5 min
- RAM > 85% for 5 min
- Disk > 80% used
- Bandwidth > 80% of monthly quota

### Option B — Self-hosted (Netdata)

If you want pretty live dashboards on the server itself:

```bash
bash <(curl -SsL https://my-netdata.io/kickstart.sh) --stable-channel --disable-telemetry --dont-wait
```

Then visit `http://<server-ip>:19999` (or proxy through Nginx with basic-auth).

## 4.6 — Database Vacuuming

PostgreSQL 16 auto-vacuums by default and the workload here is small. But once a quarter, when traffic is low, run:

```bash
sudo -u postgres vacuumdb --all --analyze --verbose
```

…to consolidate stats and reclaim disk from heavy updates.

## 4.7 — Update Cadence

| What | Frequency | How |
|------|-----------|-----|
| OS security patches | Automatic via `unattended-upgrades` | Set in §1.3 |
| Reboot for kernel updates | Monthly | `sudo apt install -y needrestart` then `sudo needrestart` |
| Node minor versions | Quarterly | `sudo apt update && sudo apt install --only-upgrade nodejs` |
| App dependencies | Monthly | `npm outdated`, `npm audit fix` on staging first |
| Postgres major | Yearly | Test on staging; `pg_upgrade` is fiddly — back up first |
| Nginx | Auto-patched via apt | |
| SSL certificates | Auto via `certbot.timer` | Verified in §3.3 |

Done with this? Read **05-security-checklist.md**, which is shorter but very important.
