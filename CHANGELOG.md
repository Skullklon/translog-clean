# Changelog

All notable changes to this repo are recorded here. Dates are in `YYYY-MM-DD` format.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [0.1.0] — 2026-05-21

### Added

This repo was created as a clean, isolated copy of the Nexura RD workspace at `C:\Users\yomay\Desktop\Claude Project in me\` for independent testing. Initial contents:

- **Root**
  - `README.md`, `CHANGELOG.md`, `.gitignore`.
- **`.github/workflows/`**
  - `deploy-translog.yml` — GitHub Actions workflow that publishes `App/` to GitHub Pages on push to `main`.
  - `README.md` — explains the one-time Pages setup and how to add more workflows.
- **`App/`** — TransLog prototype (Spanish-language React-via-CDN single-page app).
  - `index(1).html` — the main app (renamed to `index.html` during deploy).
  - `transport-mgmt-dashboard.html`, `translog-app.jsx` — supporting copies.
  - `deploy.yml` — the legacy workflow shipped with the original prototype (dormant; superseded by `.github/workflows/deploy-translog.yml`).
  - `README.md`.
- **`landing-page/`** — static landing page for `nexorard.org`.
  - `index.html`, `README.md`.
- **`transport-app/`** — Node.js + Express + PostgreSQL TMS backend.
  - `package.json`, `.env.example`, `.gitignore`, `ecosystem.config.js`, `server.js`.
  - `src/config/db.js`, `src/middleware/{auth.js, errorHandler.js}`, `src/routes/{auth.js, vehicles.js, drivers.js, shipments.js}`, plus folder READMEs.
  - `migrations/001_init.sql`, `scripts/{migrate.js, seed.js}`, `public/index.html`, plus folder READMEs.
  - Top-level `README.md`.
- **`deployment/`** — production deployment playbook and assets.
  - `README.md`, `01-server-setup.md`, `02-app-deployment.md`, `03-domain-and-ssl.md`, `04-backups-and-monitoring.md`, `05-security-checklist.md`, `06-maintenance.md`.
  - `nginx/nexorard.org.conf`, `nginx/app.nexorard.org.conf`, `nginx/README.md`.
  - `scripts/server-bootstrap.sh`, `scripts/backup-postgres.sh`, `scripts/README.md`.

### Notes

- **Domain throughout: `nexorard.org`** (corrected from `nexurard.org` in the parent workspace).
- **No deprecated Nginx stubs** were carried over — only the active configs.
- **No git history** from the parent workspace — this repo starts fresh.
- All passwords and secrets in `.env.example` are placeholders and must be regenerated before deploying.
