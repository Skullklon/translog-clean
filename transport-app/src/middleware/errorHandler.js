/**
 * Centralized error handler.
 *
 * Convert thrown errors into JSON responses with the right status code,
 * and keep stack traces out of production responses.
 */

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: err.expose ? err.message : (status < 500 ? err.message : 'Internal server error'),
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = errorHandler;
