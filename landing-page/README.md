# landing-page/ — Nexura RD Company Website

Single-file, self-contained, responsive landing page for `nexorard.org`. No build step, no dependencies beyond Google Fonts (loaded over HTTPS).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Complete landing page: HTML, CSS, and JS in one file. Deploy as-is. |
| `README.md` | This file. |

## Sections (in order)

1. **Navigation** — fixed, glassy, with mobile burger menu and a "Get a Quote" CTA.
2. **Hero** — headline, value prop, dual CTAs (Start a project / Explore services), stat strip, animated orbit graphic.
3. **About** — mission, three differentiators, stats card.
4. **Services** — four cards: Transportation, Automation & AI, Remote Support, Consulting.
5. **Transportation flagship** — feature stripe describing the in-house TMS platform with an animated route map.
6. **Automation & AI** — three sub-services: document intelligence, chat agents, workflow automation.
7. **Remote Support** — monitoring, patching, help-desk.
8. **CTA strip** — gradient call-out to book a call.
9. **Contact** — WhatsApp / email / phone / HQ + simple form (front-end only — see below).
10. **Footer** — brand, services, company, contact columns.
11. **Floating WhatsApp button** — fixed bottom-right, opens `wa.me/<number>` with a prefilled message.

## Branding

- **Palette** — deep navy `#0a0f1e` background, brand gradient cyan→blue→violet (`#00e0c6` → `#4f7cff` → `#8b5cf6`).
- **Type** — Inter for body, Space Grotesk for display headings (both from Google Fonts).
- **Motion** — scroll-reveal via IntersectionObserver, orbit & pulse animations on the hero graphic, animated dashed route on the TMS map, hover-following glow on service cards.

## Preview Locally

Open `index.html` directly in any modern browser. No server required.

```bash
# from this folder
xdg-open index.html         # Linux
open index.html             # macOS
start index.html            # Windows
```

If you want to serve over HTTP (useful for testing absolute URLs):

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Customization Checklist (before going live)

The file ships with placeholder content. Replace these before publishing:

| Where | What to replace |
|-------|-----------------|
| WhatsApp links (`wa.me/18095550100`) | Your real WhatsApp number in international format, no `+`. |
| Email (`hello@nexorard.org`) | Your real intake address. |
| Phone (`+1 (809) 555-0100`) | Your real phone number. |
| Headquarters (`Santo Domingo, Dominican Republic`) | Your actual location. |
| Stats (`24/7`, `30+`, `99.9%`) | Real numbers, or remove the stat strip. |
| Founded (`2024`), Specialists (`15+`) | Real values in the About card. |
| Contact form submit | The form currently logs to the console. Wire it to a backend (`/api/contact` in the transport app), Formspree, Resend, or another email service. See **Wiring the contact form** below. |

## Wiring the Contact Form

Two recommended options:

### Option A — Use the transport app's API

Add a `POST /api/contact` endpoint in `transport-app/src/routes/contact.js` that stores submissions and sends an email (via Resend, SES, or SMTP). Then replace the `handleSubmit` function in `index.html` with:

```js
async function handleSubmit(ev){
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.target));
  const res = await fetch('https://api.nexorard.org/api/contact', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  document.getElementById('formStatus').style.display = 'block';
  ev.target.reset();
  return false;
}
```

### Option B — Use Formspree / Resend / Web3Forms

Drop in a hosted form service that handles spam, storage, and delivery. Replace the `<form>` `action` and `method` per their docs. Lowest friction; no backend changes.

## Deploying

The page is static, so any Nginx vhost serving the file will work. The deployment playbook (`../deployment/03-domain-and-ssl.md`) walks through:

1. Copy `index.html` to `/var/www/nexorard.org/` on the server.
2. Enable the Nginx config in `deployment/nginx/nexorard.org.conf`.
3. Issue an SSL certificate via Let's Encrypt.

## Accessibility & Performance Notes

- Semantic HTML5 (`<nav>`, `<header>`, `<section>`, `<footer>`) with skip-friendly anchors.
- All decorative SVGs marked `aria-hidden="true"`.
- Font load uses `preconnect`; consider self-hosting Inter & Space Grotesk to drop the external request.
- All animations respect `prefers-reduced-motion` only via being short/subtle — for stricter compliance, wrap animations in a `@media (prefers-reduced-motion: no-preference)` query.
- Lighthouse target: 95+ across the board with no further changes.

## Future Improvements

- Add a real OG/Twitter share image (`landing-page/og.png`, 1200×630).
- Add `favicon.ico` and `favicon.svg`.
- Optional case-studies / clients section once you have logos to show.
- Split CSS/JS into separate files if the page grows past ~30KB compressed.
