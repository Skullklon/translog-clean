/**
 * Nexura RD Transportation App — entry point.
 *
 * Responsibilities:
 *   • Load environment.
 *   • Wire security middleware (helmet, CORS, rate limit).
 *   • Mount routes.
 *   • Serve a minimal static admin UI from /public.
 *   • Graceful shutdown on SIGTERM / SIGINT (important for PM2 reloads).
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { pool } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Security & basics ─────────────────────────────────────────────
app.set('trust proxy', 1);                       // we sit behind Nginx
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Same-origin and curl requests have no Origin header — allow them.
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ── Health & readiness ────────────────────────────────────────────
app.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/readyz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', error: err.message });
  }
});

// ── API routes ────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/vehicles', require('./src/routes/vehicles'));
app.use('/api/drivers', require('./src/routes/drivers'));
app.use('/api/shipments', require('./src/routes/shipments'));

// ── Static admin UI ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler (always last) ───────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[nexura-transport] listening on :${PORT} (${NODE_ENV})`);
});

// ── Graceful shutdown ─────────────────────────────────────────────
function shutdown(signal) {
  console.log(`[nexura-transport] received ${signal}, shutting down…`);
  server.close(async () => {
    try { await pool.end(); } catch {}
    console.log('[nexura-transport] closed');
    process.exit(0);
  });
  // Force-exit if we hang
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
