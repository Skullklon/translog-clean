# transport-app/src/ — Application Source

All non-entry-point application code. `server.js` in the parent folder requires from here.

## Subfolders

| Folder | Purpose |
|--------|---------|
| `config/` | Configuration wiring — database pool, anything else that reads from `process.env`. |
| `middleware/` | Express middleware: authentication, error handling. |
| `routes/` | HTTP route handlers, grouped by resource (auth, vehicles, drivers, shipments). |

## Conventions

- **Routes** should be thin: parse input → call a service → return JSON. Keep business logic out of route files once they grow past ~100 lines.
- **Errors** thrown inside a route handler are caught by `middleware/errorHandler.js`. To return a specific status, throw `{status: 400, message: '...', expose: true}` or extend an Error subclass.
- **Database access** goes through `config/db.js`'s `query(text, params)` — always parameterized, never string-interpolated.
- **Async** all handlers are `async` and wrap their work in `try/catch` with `next(err)` to surface to the central error handler.

## Suggested Future Layout

When the codebase grows, split:

```
src/
├── config/
├── middleware/
├── routes/
├── controllers/     <- route handlers extracted to here
├── services/        <- business logic, reusable across controllers
├── models/          <- DB access functions, one file per table
└── utils/           <- small helpers (date math, formatters, validators)
```

The current flat layout is intentionally simple — split only when files get unwieldy.
