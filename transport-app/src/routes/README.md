# transport-app/src/routes/ — HTTP Routes

One file per resource. Each file exports an `express.Router()` that is mounted in `server.js` under `/api/<name>`.

## Files

| File | Mount | Endpoints |
|------|-------|-----------|
| `auth.js`     | `/api/auth`     | `POST /register`, `POST /login` |
| `vehicles.js` | `/api/vehicles` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `drivers.js`  | `/api/drivers`  | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `shipments.js`| `/api/shipments`| `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |

See the parent folder's main README (`../../README.md`) for the full API reference table including request bodies and role requirements.

## Adding a New Resource

1. Create `src/routes/<resource>.js` following the pattern of `vehicles.js`.
2. Add a migration in `migrations/` for the new table.
3. Mount it in `server.js`:
   ```js
   app.use('/api/<resource>', require('./src/routes/<resource>'));
   ```
4. Document the endpoints in `transport-app/README.md` and add a CHANGELOG entry.
