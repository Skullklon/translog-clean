#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────
# Nexura RD — Ubuntu 22.04 bootstrap.
# Run as root on a fresh VPS.  Idempotent — safe to re-run.
#
# What it does:
#   • Updates the system and enables unattended-upgrades.
#   • Installs base tools, UFW, fail2ban, Nginx, certbot, Node 20, Postgres 16.
#   • Creates a non-root user "nexura" with sudo.
#   • Opens 22/80/443 in UFW; closes everything else.
#   • Adds 2 GB swap if the box has ≤ 2 GB RAM.
#
# It does NOT:
#   • Harden SSH (you must edit /etc/ssh/sshd_config — see 01-server-setup.md §1.5).
#   • Deploy app source (see 02-app-deployment.md).
#   • Create DB roles or run migrations.
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

log "Updating system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

log "Installing base packages"
apt-get install -y \
  ca-certificates curl gnupg lsb-release software-properties-common \
  ufw fail2ban htop net-tools git rsync zip unzip jq unattended-upgrades

log "Enabling automatic security upgrades"
dpkg-reconfigure -plow unattended-upgrades || true

log "Configuring firewall (UFW)"
ufw --force default deny incoming
ufw --force default allow outgoing
ufw allow 22/tcp  comment 'SSH'
ufw allow 80/tcp  comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

log "Enabling fail2ban"
systemctl enable --now fail2ban

log "Creating non-root user 'nexura'"
if ! id -u nexura >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" nexura
  usermod -aG sudo nexura
fi
mkdir -p /home/nexura/.ssh
if [[ -f /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys /home/nexura/.ssh/authorized_keys
fi
chown -R nexura:nexura /home/nexura/.ssh
chmod 700 /home/nexura/.ssh
chmod 600 /home/nexura/.ssh/authorized_keys 2>/dev/null || true

log "Installing Node.js 20 LTS"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs build-essential
fi
node --version
npm --version

log "Installing PM2"
npm install -g pm2

log "Installing PostgreSQL 16"
if ! command -v psql >/dev/null 2>&1 || ! psql --version | grep -q "16\."; then
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -y
  apt-get install -y postgresql-16 postgresql-client-16
fi
systemctl enable --now postgresql

log "Installing Nginx and certbot"
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx

log "Adding swap if RAM is small"
TOTAL_MEM_KB=$(awk '/MemTotal/{print $2}' /proc/meminfo)
if (( TOTAL_MEM_KB < 4000000 )) && ! swapon --show | grep -q swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

log "Preparing app directories"
install -d -o nexura -g nexura /srv/nexura /var/www/nexorard.org

log "Hardening Nginx"
sed -i 's/^# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf || true
nginx -t && systemctl reload nginx

log "Done. Next steps:"
cat <<EOF

  1. Harden SSH (deployment/01-server-setup.md §1.5):
       edit /etc/ssh/sshd_config:
         PermitRootLogin no
         PasswordAuthentication no
       then: systemctl restart ssh

  2. Switch to the nexura user:
       ssh nexura@<this-server-ip>

  3. Follow deployment/02-app-deployment.md from §2.4 onwards.

EOF
