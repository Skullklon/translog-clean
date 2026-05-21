# deployment/ — Production Deployment Playbook

This folder contains everything you need to take the Nexura RD landing page and the transport app from `localhost` to a live, SSL-secured site on `nexorard.org` and `app.nexorard.org`.

If you've never deployed a Node app before, follow the files **in order**. Each step is independent, idempotent (safe to re-run), and explains the *why*, not just the *what*.

## Reading Order

| # | File | What it covers | Time |
|---|------|----------------|------|
| 1 | [`01-server-setup.md`](01-server-setup.md) | Pick a VPS, harden Ubuntu 22.04, set up firewall, swap, non-root user, SSH keys | 45 min |
| 2 | [`02-app-deployment.md`](02-app-deployment.md) | Install Node 20 + PostgreSQL 16, deploy the transport app, run it with PM2 | 45 min |
| 3 | [`03-domain-and-ssl.md`](03-domain-and-ssl.md) | DNS records for `nexorard.org`, Nginx vhosts, Let's Encrypt SSL | 30 min |
| 4 | [`04-backups-and-monitoring.md`](04-backups-and-monitoring.md) | Nightly `pg_dump`, off-site copies, log rotation, uptime monitoring | 30 min |
| 5 | [`05-security-checklist.md`](05-security-checklist.md) | The list to run through before announcing the site | 20 min |
| 6 | [`06-maintenance.md`](06-maintenance.md) | Updates, scaling, rollback, on-call runbook | reference |

Plus reusable assets:

- `nginx/nexorard.org.conf` — site config for the landing page.
- `nginx/app.nexorard.org.conf` — reverse-proxy config for the app.
- `scripts/server-bootstrap.sh` — one-shot Ubuntu bootstrap.
- `scripts/backup-postgres.sh` — nightly DB backup.

## Architecture (Target State)

```
                Internet (HTTPS only)
                         │
              ┌──────────▼──────────┐
              │   Nginx (80/443)    │  serves nexorard.org statically,
              │                     │  reverse-proxies app.nexorard.org → :4000
              └──────────┬──────────┘
                         │
                ┌────────▼────────┐
                │   PM2 daemon    │  keeps node alive, restarts on crash
                │                 │
                │  Nexura app     │
                │  (server.js)    │
                └────────┬────────┘
                         │
                 ┌───────▼────────┐
                 │ PostgreSQL 16  │  local Unix socket, peer auth
                 └────────────────┘

  Off-server: DNS at registrar, Let's Encrypt, optional off-site backup target.
```

## Prerequisites Checklist

Before starting, gather:

- [ ] **Domain access** — login to the registrar for `nexorard.org` (to edit DNS).
- [ ] **VPS provider account** — Hetzner / DigitalOcean / Vultr / Contabo / Linode.
- [ ] **SSH client** — Mac/Linux: `ssh` is built in. Windows: use Windows Terminal (PowerShell) or [WSL](https://learn.microsoft.com/en-us/windows/wsl/install).
- [ ] **A strong password** — for the admin user you'll seed. Use a password manager.
- [ ] **A second machine or phone** — to verify SSH from a different network if you lock yourself out.

## Recommended VPS Sizes (Starter)

| Provider | Plan | vCPU / RAM / Disk | ~Monthly | Good for |
|----------|------|-------------------|----------|----------|
| Hetzner Cloud | CX22 | 2 / 4 GB / 40 GB | €4 | Best value; EU regions. |
| DigitalOcean | Basic Regular | 1 / 2 GB / 50 GB | $12 | Easy UX; global regions. |
| Vultr | Cloud Compute Regular | 1 / 2 GB / 55 GB | $12 | Many regions, predictable. |
| Contabo | VPS S | 4 / 8 GB / 200 GB | €5 | Very cheap; noisier neighbors. |
| Linode | Nanode 1GB | 1 / 1 GB / 25 GB | $5 | OK for landing-page-only deploys. |

**Recommendation:** start with **Hetzner CX22** or **DigitalOcean 2GB**. Either is plenty for the landing page + app + Postgres until you have hundreds of daily users.

## Deployment Checklist (Print This)

Walk through these in order. Don't skip — each one is a checkpoint you can roll back from.

- [ ] VPS created, Ubuntu 22.04 LTS selected
- [ ] SSH key uploaded; you can `ssh root@<ip>`
- [ ] Bootstrap script run (or manual server setup completed)
- [ ] Firewall (UFW) active: 22, 80, 443 only
- [ ] Non-root user `nexura` created with sudo
- [ ] SSH password-login disabled, root-login disabled
- [ ] Node.js 20 + PostgreSQL 16 + Nginx + PM2 installed
- [ ] Postgres role + database created; `.env` filled in
- [ ] App source synced to `/srv/nexura/transport-app/`
- [ ] `npm ci --omit=dev` and `npm run migrate` completed
- [ ] First admin user seeded
- [ ] `pm2 start ecosystem.config.js --env production`, then `pm2 save` and `pm2 startup`
- [ ] DNS A records pointing at the server's IP
- [ ] Landing page copied to `/var/www/nexorard.org/`
- [ ] Nginx vhosts enabled and `nginx -t` passes
- [ ] Let's Encrypt SSL issued for both hostnames (and `www`)
- [ ] `https://nexorard.org` and `https://app.nexorard.org` load
- [ ] Backup script installed and tested
- [ ] Uptime monitor configured (UptimeRobot or BetterStack)
- [ ] Security checklist reviewed
- [ ] Recovery rehearsed (restore a backup to a scratch DB)

When every box is checked, you're production-ready.
