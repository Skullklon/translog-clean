# transport-app/public/ — Static Admin Console

Served at the application root by `express.static`. A single-file vanilla-JS admin console for the transport app — no build step, no framework.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Login form, dashboard with three tabs (Vehicles, Drivers, Shipments), modal forms for create. |

## How It Works

- Loads at `https://app.nexorard.org/` (or `http://localhost:4000/`).
- On submit of the login form, calls `POST /api/auth/login`; on success, stores `token` and `user` in `localStorage` and renders the dashboard.
- Each tab calls the matching `/api/<resource>` GET endpoint and renders a table.
- The "New …" buttons open a `<dialog>` with a barebones form; submit calls `POST /api/<resource>`.

## Customizing

This is intentionally minimal. To go further:

- Add edit/delete actions (PATCH and DELETE the resource by id).
- Add pagination (cursor or offset; the API supports `?limit=&offset=` if you add it).
- Add a charts view (e.g. shipments by status — chart.js works fine without a build).
- Swap in a framework. The Express server doesn't care — anything that `fetch`es the JSON API will work.

## Replacing Entirely

If you want a real SPA (React/Vue/Svelte/...):

1. Build it as a separate project — keep it in a `frontend/` sibling folder.
2. Build outputs to `transport-app/public/`, replacing this file.
3. Or host the SPA on `app.nexorard.org` via a third Nginx vhost and let `/api/*` reverse-proxy to the Node service.
