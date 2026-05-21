# deployment/nginx/ — Nginx Virtual Host Configs

Drop these into `/etc/nginx/sites-available/` on the server and symlink them into `/etc/nginx/sites-enabled/`. `certbot --nginx` will modify them in place to add the TLS server blocks.

## Files

| File | Hostnames | Backend |
|------|-----------|---------|
| `nexorard.org.conf` | `nexorard.org`, `www.nexorard.org` | Static — serves files from `/var/www/nexorard.org/`. |
| `app.nexorard.org.conf` | `app.nexorard.org` | Reverse proxy to `127.0.0.1:4000` (the PM2-managed Node process). |

## Install

```bash
sudo cp nexorard.org.conf     /etc/nginx/sites-available/
sudo cp app.nexorard.org.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/nexorard.org.conf      /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/app.nexorard.org.conf  /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## Security Headers Baked In

Both configs set:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

The `Strict-Transport-Security` (HSTS) header is **commented out** by default — enable it on the app vhost after you're confident HTTPS will always work (see `../03-domain-and-ssl.md` §3.4).

## After certbot Runs

`certbot --nginx -d ...` will append a new `server { listen 443 ssl; ... }` block to each file with the cert paths filled in. The original `listen 80` block is rewritten to issue a 301 redirect to HTTPS. You don't have to edit anything by hand.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `502 Bad Gateway` on `app.nexorard.org` | Node app not running. `pm2 status` to check. |
| `404 Not Found` on `nexorard.org` | Document root wrong, or `index.html` not copied to `/var/www/nexorard.org/`. |
| `nginx: [emerg] duplicate listen options` | You have a stale or conflicting vhost. `ls /etc/nginx/sites-enabled/`. |
| `Cannot find SSL certificate` | certbot ran but Nginx wasn't reloaded. `sudo systemctl reload nginx`. |
| Browser shows old version | Hard-refresh; clients cache HTML for `no-cache, max-age=0` per the static config — should be instant. |
