# 05 · Production Security Checklist

Walk through this **before** you announce the site, then again every quarter.

## Server

- [ ] SSH password authentication disabled (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] SSH root login disabled (`PermitRootLogin no`)
- [ ] Only your SSH keys in `/root/.ssh/authorized_keys` and `/home/nexura/.ssh/authorized_keys`
- [ ] UFW active, only 22/80/443 open: `sudo ufw status verbose`
- [ ] Fail2ban running: `sudo fail2ban-client status sshd`
- [ ] Automatic security updates enabled: `dpkg-reconfigure unattended-upgrades`
- [ ] Server hostname and timezone set (`hostnamectl`, `timedatectl`)
- [ ] No public services other than SSH/HTTP/HTTPS: `sudo ss -tlnp`
- [ ] System packages up to date: `sudo apt update && sudo apt list --upgradable`

## Application

- [ ] `.env` mode is 600, owned by `nexura`: `ls -l /srv/nexura/transport-app/.env`
- [ ] `JWT_SECRET` is at least 48 random bytes; never reused across environments
- [ ] `DATABASE_URL` password is long and random
- [ ] `BCRYPT_ROUNDS` ≥ 12
- [ ] `CORS_ORIGINS` is explicit (no `*`)
- [ ] `NODE_ENV=production` is set (disables verbose error responses)
- [ ] Rate limiter active and tuned for expected load
- [ ] Admin password is unique, ≥12 characters, stored in a password manager
- [ ] Test/dev accounts removed from production
- [ ] `/api/auth/register` is locked down (require admin role, or remove entirely once you've seeded users)

## Database

- [ ] PostgreSQL only listens on localhost (default; verify with `ss -tlnp | grep 5432`)
- [ ] The `nexura` DB role is **not** a superuser
- [ ] DB password is in `.env` only; not in shell history (`history -d`, `unset HISTFILE` for sensitive sessions)
- [ ] Nightly `pg_dump` backups running (§04)
- [ ] Off-site backup copy verified (§04)
- [ ] Restore tested in the last 90 days

## Web / TLS

- [ ] HTTPS works on both `nexorard.org`, `www.nexorard.org`, and `app.nexorard.org`
- [ ] HTTP → HTTPS redirect in place
- [ ] SSL Labs grade A or A+: <https://www.ssllabs.com/ssltest/>
- [ ] `certbot.timer` enabled for auto-renewal
- [ ] CAA DNS record locks cert issuance to Let's Encrypt
- [ ] HSTS header set on app subdomain (after confidence period)
- [ ] Nginx hides its version: `server_tokens off;` in `/etc/nginx/nginx.conf`
- [ ] CSP / Permissions-Policy reviewed (see `nginx/app.nexorard.org.conf`)

## Operational

- [ ] Uptime monitor configured for landing page + `/readyz`
- [ ] Alerts wired to a channel you actually check (email + WhatsApp/SMS)
- [ ] Resource alerts on CPU/RAM/disk/bandwidth
- [ ] On-call runbook documented (see `06-maintenance.md`)
- [ ] Recovery rehearsal: someone other than the original deployer has restored a backup
- [ ] Provider account uses 2FA (the VPS dashboard is the keys to the kingdom)
- [ ] Domain registrar account uses 2FA + registrar lock
- [ ] DNS provider account uses 2FA

## What's Out of Scope (Plan For It)

These aren't free in time/money, but you should know they exist:

- **WAF** (Cloudflare Free or BunkerWeb) — defends against bot/credential-stuffing at the edge.
- **Bug bounty / disclosure policy** — `/.well-known/security.txt` with a contact email.
- **Centralized logging** — Loki + Grafana, or BetterStack Logs, or Papertrail.
- **Secret scanning on commit** — `git-secrets`, `gitleaks`, or GitHub's built-in.
- **Dependency scanning** — `npm audit`, Dependabot, or Snyk.
- **Penetration test** — at minimum once before serious customer data lives in the DB.

## Common Pitfalls (We've Tripped on These)

1. **`.env` checked into git.** Even briefly. If it happens: rotate every secret in it. Do not just `git rm`.
2. **Same admin password reused on the VPS and the app.** Treat them as different blast radii.
3. **Forgetting `trust proxy`** in Express. Without it, rate-limiting keys on Nginx's IP, not the visitor's.
4. **Allowing `*` in CORS** "just for testing". It stays. Lock the list down before launch.
5. **Disabling SSL temporarily** to debug something. Browsers cache HSTS — you may lock yourself out.
6. **Leaving `/api/auth/register` open.** Anyone on the internet can create a dispatcher account.
