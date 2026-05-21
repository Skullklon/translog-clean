# 03 · Domain & SSL

Goal: `nexorard.org` and `app.nexorard.org` resolve to your server, Nginx serves the right thing on each, and both are protected with Let's Encrypt SSL.

## 3.1 — DNS Records

Log into the registrar where `nexorard.org` is registered (Namecheap, GoDaddy, Cloudflare, etc.) and open the DNS editor.

Add these records, replacing `<server-ip>` with your VPS public IP:

| Type | Name (Host) | Value | TTL |
|------|-------------|-------|-----|
| A | `@` (or blank, or `nexorard.org`) | `<server-ip>` | 300 |
| A | `www` | `<server-ip>` | 300 |
| A | `app` | `<server-ip>` | 300 |
| CAA | `@` | `0 issue "letsencrypt.org"` | 300 |

Optional but recommended:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | `api` | `<server-ip>` | If you later split the API onto its own hostname. |
| MX | `@` | `10 your-email-host` | If you'll receive mail at `@nexorard.org`. |
| TXT | `@` | `v=spf1 -all` | Reject mail spoofing your domain (if no mail is sent from the server). |

After saving, verify propagation (can take 5–30 minutes):

```bash
dig +short nexorard.org
dig +short www.nexorard.org
dig +short app.nexorard.org
```

All three should return your `<server-ip>`. Until they do, **don't run certbot** — it will fail and may get you rate-limited.

> **Using Cloudflare?** Set the proxy status to "DNS only" (grey cloud) while you issue the certificate. You can flip it to "Proxied" (orange cloud) afterwards if you want.

## 3.2 — Nginx Virtual Hosts

The configs are in this folder's `nginx/` directory. Copy them in:

```bash
sudo cp /srv/nexura/deployment/nginx/nexorard.org.conf       /etc/nginx/sites-available/
sudo cp /srv/nexura/deployment/nginx/app.nexorard.org.conf   /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/nexorard.org.conf      /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/app.nexorard.org.conf  /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

> If your source is elsewhere, just copy the two `.conf` files manually or open them with `sudo nano /etc/nginx/sites-available/nexorard.org.conf` and paste the contents.

Verify the landing page is served:

```bash
curl -sI http://nexorard.org | head -5
```

You should see `HTTP/1.1 200 OK`. (If you get a connection error, DNS hasn't propagated yet — wait and retry.)

## 3.3 — Let's Encrypt SSL with certbot

Install:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue certificates for all three hostnames in one shot:

```bash
sudo certbot --nginx \
  -d nexorard.org -d www.nexorard.org -d app.nexorard.org \
  --redirect \
  --agree-tos -m admin@nexorard.org --no-eff-email
```

What this does:

- Solves HTTP-01 challenges via Nginx on port 80.
- Downloads certificates to `/etc/letsencrypt/live/nexorard.org/`.
- **Edits your Nginx configs to add `listen 443 ssl;` blocks and HTTP→HTTPS redirects.**
- Schedules `certbot.timer` to renew certs every 12 hours (renewals only happen when ≤30 days remain).

Verify renewal is wired:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Open in a browser:

- `https://nexorard.org` → landing page, padlock icon
- `https://www.nexorard.org` → same
- `https://app.nexorard.org` → admin console login

If the app console shows `502 Bad Gateway`, the Node process isn't reachable. Confirm with:

```bash
pm2 status
curl -sS http://localhost:4000/healthz
```

## 3.4 — HTTP/2, HSTS, Modern TLS

Certbot's output already includes `listen 443 ssl http2;`. To add HSTS (commit to HTTPS for 6 months), uncomment the line in `app.nexorard.org.conf`:

```nginx
add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;
```

Reload Nginx and test:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://nexorard.org | grep -i strict-transport-security
```

> **Important:** only enable HSTS once you're confident HTTPS will always work — browsers cache it. Don't enable it on day 1 if you might roll back to HTTP.

## 3.5 — Confirm the Final State

```bash
# Both hosts answer HTTPS
curl -sI https://nexorard.org | head -3
curl -sI https://app.nexorard.org/healthz | head -3

# HTTP redirects to HTTPS
curl -sI http://nexorard.org | grep -i location
curl -sI http://app.nexorard.org | grep -i location

# SSL grade — should be A or A+
echo | openssl s_client -connect nexorard.org:443 -servername nexorard.org 2>/dev/null | openssl x509 -noout -dates
```

For a public grade, plug `https://nexorard.org` into <https://www.ssllabs.com/ssltest/>.

## 3.6 — Reference: DNS Schema Summary

```
nexorard.org         A     → <server-ip>      (landing page)
www.nexorard.org     A     → <server-ip>      (alias for landing page)
app.nexorard.org     A     → <server-ip>      (transport app)
nexorard.org         CAA   → letsencrypt.org  (lock cert issuance)
```

Why a subdomain for the app instead of `/app` on the same host?

- Clean separation: easier to host the app on a different server later (`app.nexorard.org` just points elsewhere).
- Independent SSL renewal scope.
- The marketing site and the app can be cached / rate-limited differently.
- Less risk: a config error on one vhost can't break the other.

When you're ready, move on to **04-backups-and-monitoring.md**.
