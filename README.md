# Nexura RD — Clean Test Repo

A standalone copy of the full Nexura RD workspace, prepared so you can push it to a **new GitHub repo** and run/test from a clean slate without disturbing the original repo or the existing TransLog deploy.

## Why This Folder Exists

The parent workspace contains the live working copy with full git/deploy history. This subfolder is a clean mirror of the same files, ready to be `git init`-ed and pushed to a brand-new GitHub repo for isolated testing.

Source workspace this was duplicated from:
`C:\Users\yomay\Desktop\Claude Project in me\` (2026-05-21).

## Folder Structure

```
translog-clean/
├── .github/workflows/      GitHub Actions — TransLog Pages deploy
├── .gitignore              Standard ignore list for Node + secrets
├── CHANGELOG.md            Change log starting at 0.1.0 for THIS repo
├── README.md               You are here
├── App/                    TransLog prototype (React via CDN)
├── landing-page/           Nexura RD marketing site (nexorard.org)
├── transport-app/          Node.js + Express + PostgreSQL TMS backend
└── deployment/             Server setup, DNS, SSL, PM2, Nginx, backups
```

## First-Time Setup — Push to a New GitHub Repo

The folder currently contains only the hand-adapted root docs, the GitHub Pages workflow, and small placeholder content. **Before the first commit, run the bootstrap script** to pull in all the bulk content (App/, landing-page/, transport-app/, deployment/) from the parent workspace:

```powershell
# Open Windows PowerShell, then:
cd "C:\Users\yomay\Desktop\Claude Project in me\translog-clean"
.\bootstrap-from-parent.ps1
```

If PowerShell refuses to run the script with an execution-policy error, one-time unblock:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# then re-run .\bootstrap-from-parent.ps1
```

The script:
- Copies `App/`, `landing-page/`, `transport-app/`, and `deployment/` from `..\` into this folder.
- Removes the deprecated Nginx vhost stubs (`*nexurard.org.conf` — old domain).
- Leaves `README.md`, `CHANGELOG.md`, `.gitignore`, and `.github/workflows/` untouched (those are hand-adapted for this repo).
- Is safe to re-run.

After bootstrapping:

```bash
# 1. From this folder
cd "C:\Users\yomay\Desktop\Claude Project in me\translog-clean"

# 2. Initialize git
git init -b main
git add .
git commit -m "Initial commit — clean test deployment"

# 3. Create the GitHub repo, then connect it
#    (replace <user>/<repo> with whatever you create on github.com)
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main

# 4. One-time: in the GitHub repo, open Settings → Pages → Source: GitHub Actions
```

The next push that touches `App/` (or a manual run from the Actions tab) deploys the TransLog demo to `https://<user>.github.io/<repo>/`.

## What's Different vs. the Parent Workspace

- **Fresh CHANGELOG** starting at version 0.1.0 — change history of the parent repo is not carried over.
- **No deprecated Nginx vhost stubs** — only the active `nexorard.org.conf` and `app.nexorard.org.conf` are included.
- **No git history** — this is a clean working copy, not a clone. Push history starts when you commit.
- **Same content, same domain (`nexorard.org`)**, same deployment playbook.

## Where to Go From Here

- **Test the TransLog Pages deploy:** push to a new repo, enable Pages, watch the workflow run.
- **Run the backend locally:** `transport-app/README.md` walks through `.env`, migrations, and `npm run dev`.
- **Deploy the backend to your server:** `deployment/README.md` is the entry point; follow files `01` through `06`.
- **Customize the landing page:** placeholders (WhatsApp number, contact email, stats) are listed in `landing-page/README.md` under "Customization Checklist".

## Architecture (Same as Parent)

```
                ┌───────────────────────┐
   nexorard.org │  Nginx (80/443, SSL)  │  app.nexorard.org
                └──────┬─────────┬──────┘
                       │         │
                       ▼         ▼
              ┌────────────┐  ┌──────────────────┐
              │  static    │  │  PM2 → Node.js   │
              │  landing/  │  │  Express API     │
              └────────────┘  └──────┬───────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ PostgreSQL   │
                              └──────────────┘
```

## Conventions (Repeated for the New Repo)

- Every folder has a `README.md` describing its purpose and files.
- Every change is logged in `CHANGELOG.md` with a timestamp.
- Secrets never live in committed files — only in `.env`, which is git-ignored.
- Production targets: Ubuntu 22.04 LTS, Node.js 20 LTS, PostgreSQL 16, Nginx, PM2, Let's Encrypt.

## Contact

Project owner: Nexura RD — `nexorard.org`
