# transport-app/src/middleware/ — Express Middleware

Reusable middleware composed into `server.js` or per-route.

## Files

| File | Exports | Used by |
|------|---------|---------|
| `auth.js` | `requireAuth`, `requireRole(...roles)` | All `/api/*` routes except `/api/auth/login` and `/api/auth/register`. |
| `errorHandler.js` | default export (function) | Mounted last in `server.js`; converts thrown errors into JSON responses. |

## `requireAuth`

Reads the `Authorization: Bearer <token>` header, verifies the JWT with `JWT_SECRET`, and attaches `req.user = { id, email, role }`. Returns 401 on missing or invalid tokens.

## `requireRole(...roles)`

Use after `requireAuth`:

```js
router.delete('/:id', requireAuth, requireRole('admin'), handler);
```

Returns 403 if the authenticated user's role isn't in the allowed list.

## `errorHandler`

- Reads `err.status` (or `err.statusCode`) for the response status, defaulting to 500.
- In `NODE_ENV=production`, omits stack traces from the response body.
- Only exposes `err.message` to clients if `err.expose === true` or the status is < 500.
- Logs 5xx errors to stderr.
