# 01 · Server Setup

Goal: a hardened Ubuntu 22.04 server, ready to receive the app.

> Don't skip the security parts. A bare Ubuntu VPS gets scanned by attackers within minutes of going live. The firewall and SSH hardening below are the bare minimum.

## 1.1 — Create the VPS

1. In your provider's dashboard, create a new Linux server.
2. **Image / OS:** Ubuntu 22.04 LTS (or 24.04 if available — instructions are identical).
3. **Size:** the smallest plan with **at least 2 GB RAM** (see recommended sizes in `README.md`).
4. **SSH key:** upload your public key (`~/.ssh/id_ed25519.pub`).
   - On Mac/Linux, generate one with `ssh-keygen -t ed25519 -C "you@nexorard.org"` if you don't have one.
   - On Windows, run the same in Windows Terminal / WSL, or use PuTTYgen.
5. **Backups:** enable provider snapshots if the cost is acceptable (~20% of VPS price). They're a great safety net.
6. Note the IP address.

## 1.2 — First SSH Login

```bash
ssh root@<server-ip>
```

If this fails with "Permission denied (publickey)", your SSH key isn't on the server. Use the provider's web console to log in, then add it manually:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA...your-key... you@nexorard.org" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 1.3 — Update the System

```bash
apt update && apt upgrade -y
apt install -y unattended-upgrades ca-certificates curl gnupg lsb-release software-properties-common ufw fail2ban htop net-tools git rsync
dpkg-reconfigure -plow unattended-upgrades   # press Enter, confirm "Yes"
```

`unattended-upgrades` will keep security patches applied without your intervention.

## 1.4 — Create a Non-Root User

You should never run the app — or even log in day-to-day — as root.

```bash
adduser --disabled-password --gecos "" nexura
usermod -aG sudo nexura
mkdir -p /home/nexura/.ssh
cp ~/.ssh/authorized_keys /home/nexura/.ssh/
chown -R nexura:nexura /home/nexura/.ssh
chmod 700 /home/nexura/.ssh && chmod 600 /home/nexura/.ssh/authorized_keys
```

Open a **new terminal** (keep the root one open as backup) and test:

```bash
ssh nexura@<server-ip>
sudo whoami     # should print: root
```

If that works, harden SSH:

## 1.5 — Harden SSH

Edit `/etc/ssh/sshd_config` (use `sudo nano` or `sudo vim`):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
```

Reload:

```bash
sudo systemctl restart ssh
```

Verify in a **new** terminal you can still log in as `nexura` before closing your old root session. If you can't, use the provider's web console to fix the config.

## 1.6 — Firewall (UFW)

Allow only SSH + HTTP + HTTPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        comment 'SSH'
sudo ufw allow 80/tcp        comment 'HTTP'
sudo ufw allow 443/tcp       comment 'HTTPS'
sudo ufw enable              # confirm with 'y'
sudo ufw status verbose
```

> **Tip:** If you use a non-standard SSH port (e.g., 2222), change the `Port` directive in `sshd_config` *and* the UFW rule before disconnecting.

## 1.7 — Fail2ban (block brute-force SSH)

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

The Ubuntu default config is sane (10-minute ban after 5 failed attempts). If you want to tune it, copy `/etc/fail2ban/jail.conf` to `jail.local` and edit there.

## 1.8 — Swap (if RAM is small)

If your VPS has ≤ 2 GB RAM, add a 2 GB swap file so `npm install` and Postgres autovacuum don't OOM-kill each other:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
free -h
```

## 1.9 — Timezone & Hostname

```bash
sudo timedatectl set-timezone America/Santo_Domingo  # or your TZ
sudo hostnamectl set-hostname nexura-prod-01
```

Add the hostname to `/etc/hosts`:

```bash
sudo sed -i "s/^127.0.1.1.*/127.0.1.1\tnexura-prod-01/" /etc/hosts
```

## 1.10 — Verify

A quick health snapshot:

```bash
echo "── uptime ──";        uptime
echo "── disk ──";          df -h /
echo "── memory ──";        free -h
echo "── firewall ──";      sudo ufw status
echo "── ssh config ──";    sudo sshd -T | grep -E "permitrootlogin|passwordauthentication"
echo "── fail2ban ──";      sudo fail2ban-client status
```

If everything looks healthy, proceed to **02-app-deployment.md**.

---

### Shortcut: One-Shot Bootstrap

Most of the above is in `scripts/server-bootstrap.sh`. After SSHing in as root for the first time:

```bash
curl -fsSL https://<your-host>/server-bootstrap.sh | sudo bash
# or copy it over with scp / paste into a file and run
```

Then continue from §1.5 (SSH hardening).
