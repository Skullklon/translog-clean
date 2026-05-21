# .github/workflows/ — GitHub Actions

CI/CD workflows that run on this repository.

## Files

| File | Trigger | What it does |
|------|---------|--------------|
| `deploy-translog.yml` | Push to `main` touching `App/**` (or manual run) | Builds the TransLog prototype into a Pages-ready site (renaming `index(1).html` → `index.html`) and publishes it to GitHub Pages. |

## One-Time Repo Setup (Required Before First Run)

The workflow uses GitHub's "Actions" Pages source, which has to be enabled by hand once:

1. Open the repo on GitHub.
2. **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Save.

That's it. The next push to `main` that touches `App/` will deploy automatically. You can also trigger the workflow manually from the **Actions** tab → **Deploy TransLog to GitHub Pages** → **Run workflow**.

## After the First Successful Run

Your TransLog demo will be live at:

```
https://<your-github-username>.github.io/<repo-name>/
```

GitHub will show the exact URL on **Settings → Pages** after the deploy completes.

## Local Test of the Build Step

If you want to preview what will be deployed without pushing, replicate the workflow locally:

```bash
mkdir -p _site
cp -r App/. _site/
[ -f "_site/index(1).html" ] && [ ! -f "_site/index.html" ] && mv "_site/index(1).html" "_site/index.html"
rm -f _site/deploy.yml
touch _site/.nojekyll
python3 -m http.server -d _site 8080
# open http://localhost:8080
```

That serves the staging directory exactly as it will appear on Pages.

## Note on `App/deploy.yml`

There's an older `App/deploy.yml` that was carried over from the original TransLog prototype. **GitHub only loads workflows from `.github/workflows/`**, so that file is dormant and has no effect — it's harmless but obsolete. Feel free to delete `App/deploy.yml` whenever you're cleaning up.

## Adding More Workflows

When you're ready to also deploy the landing page or the transport-app admin console to Pages, add new files alongside `deploy-translog.yml`:

- `deploy-landing.yml` — same pattern, source `landing-page/` instead of `App/`.
- `deploy-admin.yml` — for `transport-app/public/`. Note that the admin console needs the backend API reachable from the browser; on GitHub Pages it can't be hosted at the same origin as the API, so wire `CORS_ORIGINS` appropriately on your backend.

Pages serves **one site per repo** at the root URL. If you want multiple sites in one repo (landing + demo + admin), each non-root site has to live under a subpath of the same publish artifact. The simplest pattern: combine them in the build step and copy into `_site/landing/`, `_site/demo/`, `_site/admin/`.
