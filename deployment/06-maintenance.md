# 06 · Maintenance & Operations Runbook

A short reference for everything that happens after launch.

## Deploying a Code Update

Cleanest flow when using git:

```bash
ssh nexura@<server-ip>
cd /srv/nexura/transport-app
git pull
npm ci --omit=dev
npm run migrate              # idempotent; only runs new files
pm2 reload nexura-transport
pm2 logs nexura-transport --lines 100
```

If you're not on git, the rsync command from `02-app-deployment.md` §2.5 Option B works the same. Always `pm2 reload` (not `restart`) for the lowest blip.

## Deploying a Landing-Page Update

The landing page is static. Just rsync it:

```bash
rsync -avz --delete \
  "/path/to/Claude Project in me/landing-page/" \
  nexura@<server-ip>:/var/www/nexorard.org/
```

No service reload needed. Refresh the browser.

## Rolling Back

### App rollback

```bash
cd /srv/nexura/transport-app
git log --oneline -n 10               # find the previous good commit
git checkout <sha>                    # detached HEAD
npm ci --omit=dev
pm2 reload nexura-transport
```

Once you've confirmed the rollback works, branch from that SHA and revert forward properly.

### Database rollback

There is no auto-rollback for schema migrations. If a migration broke production:

1. **Stop the app:** `pm2 stop nexura-transport`.
2. **Restore yesterday's backup into a scratch DB:**
   ```bash
   sudo -u postgres createdb nexura_rollback
   zcat /var/backups/postgres/nexura_transport-<yesterday>.sql.gz | sudo -u postgres psql -d nexura_rollback
   ```
3. **Inspect** — compare to current; figure out what's recoverable.
4. **Swap:** rename current DB out of the way, rename rollback DB in.
   ```bash
   sudo -u postgres psql -c "ALTER DATABASE nexura_transport RENAME TO nexura_transport_broken;"
   sudo -u postgres psql -c "ALTER DATABASE nexura_rollback   RENAME TO nexura_transport;"
   ```
5. Restart: `pm2 start nexura-transport`.

This is destructive — practice it on staging before you need it.

## Scaling Up

### Stage 1: vertical (upgrade the VPS)

DigitalOcean / Hetzner / Vultr let you resize in place with a 1–2 minute reboot. Bump CPU/RAM. No code changes needed.

### Stage 2: separate the database

Move Postgres to its own VPS (or managed service like DigitalOcean Managed Postgres / Neon):

1. Provision the new DB.
2. `pg_dump` from old, `psql` into new.
3. Update `DATABASE_URL` in `.env`.
4. `pm2 reload nexura-transport`.

### Stage 3: multiple app servers

PM2's `instances: 'max'` runs one Node process per CPU core *on the same host*. For multiple hosts, put a load balancer (DigitalOcean LB, Hetzner LB, or Nginx on a small front host) in front of N app servers. Use sticky sessions only if you keep server-side session state — this app is stateless via JWT, so plain round-robin works.

### Stage 4: read replicas

For heavy read traffic, add a Postgres replica and route reports/dashboards there. Application code change needed.

## Routine Checks (Weekly, 5 minutes)

```bash
# Disk
df -h /
# Memory
free -h
# Logs that grew unexpectedly
sudo du -sh /var/log/* /srv/nexura/transport-app/logs/* | sort -h | tail
# App health
pm2 status
curl -sS https://app.nexorard.org/readyz | jq .
# DB size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('nexura_transport'));"
# Recent errors
pm2 logs nexura-transport --err --lines 200 --nostream
sudo tail -n 50 /var/log/nginx/error.log
```

## On-Call Runbook

### "The site is down"

1. **Check from your laptop:** `curl -I https://nexorard.org`. If it times out, it's the server or DNS.
2. **SSH in:** `ssh nexura@<server-ip>`. If you can't reach it, check the VPS provider status page.
3. **Check services:**
   ```bash
   pm2 status
   sudo systemctl status nginx postgresql
   ```
4. **Quick wins:**
   - PM2 status `stopped` → `pm2 restart nexura-transport`
   - Nginx down → `sudo systemctl restart nginx`
   - Postgres down → `sudo systemctl restart postgresql`
5. **Check disk:** `df -h /` — if full, see `04-backups-and-monitoring.md`.
6. **Tail errors:** `pm2 logs nexura-transport --err --lines 200`.

### "Login isn't working"

- Check `/readyz` — if 503, the DB is unreachable. Restart Postgres or check the password in `.env`.
- Check rate limit — if a customer's IP got rate-limited, they'll see HTTP 429.

### "Cert expired"

Shouldn't happen — certbot.timer auto-renews. But if it does:

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

If certbot fails with "DNS challenge…" or "challenge timeout", DNS or port 80 is unreachable.

### "Disk is full"

Most likely culprits, in order:

1. PostgreSQL logs — `sudo du -sh /var/log/postgresql/`
2. Old backups — `ls -lh /var/backups/postgres/` (the backup script should rotate these)
3. Nginx access logs — `sudo logrotate -f /etc/logrotate.d/nginx`
4. PM2 logs — should be rotated; check `pm2 set pm2-logrotate:max_size 10M`

Quick relief: `sudo find /var/log -name "*.gz" -mtime +30 -delete`.

## Migrating to a New Server

1. Provision new VPS, run `01-server-setup.md`.
2. Install runtimes per `02-app-deployment.md` §2.1–2.3.
3. Restore the latest DB backup onto the new server.
4. Sync the latest source.
5. Update DNS records to the new IP.
6. Wait for TTL to expire (use a low TTL like 60s on the day of the move).
7. After confirming the new server serves traffic, retire the old one.

## Quarterly

- [ ] Run through the security checklist in `05-security-checklist.md`.
- [ ] Test a backup restore on a scratch DB.
- [ ] Review user accounts — remove people who've left.
- [ ] Rotate `JWT_SECRET` if there's been any suspicion of compromise (this signs all users out, which is fine).
- [ ] Bump dependencies: `npm outdated`, `npm audit`.

## Yearly

- [ ] Renew the domain registration. Most registrars autorenew, but verify.
- [ ] Major OS upgrade (Ubuntu LTS → next LTS) — read release notes first; back up; test on staging.
- [ ] Reassess hosting costs and capacity — usually you can either downsize (off-peak) or you've grown and should upgrade.
