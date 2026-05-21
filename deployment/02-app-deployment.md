# 02 · App Deployment

Goal: Node.js 20, PostgreSQL 16, the transport app source on disk, schema applied, and PM2 keeping it alive.

All commands are run as the **non-root user `nexura`** unless they need `sudo`.

## 2.1 — Install Node.js 20 LTS

We use NodeSource's official APT repo so you get a real LTS, not Ubuntu's older default.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node --version       # v20.x
npm --version
```

Install PM2 globally:

```bash
sudo npm install -g pm2
pm2 --version
```

## 2.2 — Install PostgreSQL 16

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Create the app database and role

```bash
# Pick a strong password and stash it in your password manager
DBPASS=$(openssl rand -base64 24)
echo "Database password: $DBPASS"

sudo -u postgres psql <<SQL
CREATE ROLE nexura WITH LOGIN PASSWORD '$DBPASS';
CREATE DATABASE nexura_transport OWNER nexura;
GRANT ALL PRIVILEGES ON DATABASE nexura_transport TO nexura;
SQL
```

Verify:

```bash
PGPASSWORD="$DBPASS" psql -h localhost -U nexura -d nexura_transport -c "SELECT current_user, current_database();"
```

## 2.3 — Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -I http://localhost      # should return HTTP/1.1 200
```

The default page is fine for now — we'll replace it in **03-domain-and-ssl.md**.

## 2.4 — Lay Out the App Directory

```bash
sudo mkdir -p /srv/nexura /var/www/nexorard.org
sudo chown -R nexura:nexura /srv/nexura /var/www/nexorard.org
```

## 2.5 — Transfer the Source Code

Pick one of the three options.

### Option A — From a Git repository (recommended)

Put this workspace into a private Git repo (GitHub, GitLab, Gitea), add a deploy key, then:

```bash
cd /srv/nexura
git clone git@github.com:your-org/nexura.git .
```

### Option B — `rsync` from your laptop

From your local machine, **not** the server:

```bash
rsync -avz --exclude node_modules --exclude .env \
  "/path/to/Claude Project in me/transport-app/" \
  nexura@<server-ip>:/srv/nexura/transport-app/

rsync -avz \
  "/path/to/Claude Project in me/landing-page/" \
  nexura@<server-ip>:/var/www/nexorard.org/
```

### Option C — `scp` zip

From your local machine:

```bash
zip -r nexura.zip "Claude Project in me/transport-app" "Claude Project in me/landing-page"
scp nexura.zip nexura@<server-ip>:~
ssh nexura@<server-ip>
unzip ~/nexura.zip
mv "Claude Project in me/transport-app" /srv/nexura/
mv "Claude Project in me/landing-page"/* /var/www/nexorard.org/
```

## 2.6 — Configure the App

```bash
cd /srv/nexura/transport-app
cp .env.example .env
nano .env       # fill in real values, see below
```

Minimum settings to change in `.env`:

```ini
NODE_ENV=production
PORT=4000
APP_URL=https://app.nexorard.org

DATABASE_URL=postgres://nexura:<PASTE_DBPASS>@localhost:5432/nexura_transport

JWT_SECRET=<paste output of: openssl rand -hex 48>
JWT_EXPIRES_IN=12h
BCRYPT_ROUNDS=12

CORS_ORIGINS=https://nexorard.org,https://app.nexorard.org

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Lock the file down so other users on the box can't read your secrets:

```bash
chmod 600 .env
```

## 2.7 — Install & Migrate

```bash
cd /srv/nexura/transport-app
npm ci --omit=dev
npm run migrate
```

## 2.8 — Seed the First Admin

Pick a strong password (≥12 chars):

```bash
ADMIN_EMAIL=admin@nexorard.org \
ADMIN_PASSWORD='StrongPassPhrase!2026' \
ADMIN_NAME='Administrator' \
npm run seed
```

## 2.9 — Smoke-Test Without PM2

```bash
node server.js &
sleep 2
curl -sS http://localhost:4000/healthz
curl -sS http://localhost:4000/readyz
kill %1
```

You should see `{"status":"ok",...}` and `{"status":"ready"}`. If `readyz` fails, the DB connection isn't working — re-check `DATABASE_URL` in `.env`.

## 2.10 — Start with PM2

```bash
cd /srv/nexura/transport-app
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save                      # remember current process list
pm2 startup                   # run the printed command (it generates a systemd unit)
pm2 status
pm2 logs nexura-transport --lines 50
```

Useful PM2 commands:

| Command | Effect |
|---------|--------|
| `pm2 status` | Show running processes |
| `pm2 logs nexura-transport` | Tail the logs |
| `pm2 restart nexura-transport` | Restart |
| `pm2 reload nexura-transport` | Zero-downtime reload (single instance: same as restart) |
| `pm2 stop nexura-transport` | Stop without removing |
| `pm2 delete nexura-transport` | Remove from PM2 |
| `pm2 monit` | Live CPU/RAM dashboard |

## 2.11 — Log Rotation

PM2 logs grow unbounded by default. Install the rotation module:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

That keeps 14 compressed log files of 10 MB each — about 140 MB max.

## 2.12 — Confirm Direct Access via the IP

Until DNS + Nginx is set up, test from your laptop:

```bash
curl -sS http://<server-ip>:4000/healthz
```

You won't be able to hit the IP from the public internet yet (port 4000 is blocked by UFW — that's correct). Use an SSH tunnel:

```bash
ssh -L 4000:localhost:4000 nexura@<server-ip>
# then on your laptop:
open http://localhost:4000     # macOS / xdg-open on Linux / start on Windows
```

If the admin console loads and you can sign in, the app is running cleanly. Time to wire up the domain in **03-domain-and-ssl.md**.

---

## Updating the App Later

```bash
cd /srv/nexura/transport-app
git pull                           # if using git
# or: rsync from your laptop with the same command as 2.5 Option B
npm ci --omit=dev
npm run migrate                    # safe; only runs new SQL files
pm2 reload nexura-transport
pm2 logs nexura-transport
```
