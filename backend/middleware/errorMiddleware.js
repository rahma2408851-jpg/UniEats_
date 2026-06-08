/**
 * errorMiddleware.js
 * Centralised Express error-handling middleware.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('[ERROR]', err.stack || err.message);
  } else {
    console.error('[ERROR]', err.message);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Internal Server Error';

  // API requests get JSON, browser requests get a rendered error page
  const isApiRequest = req.originalUrl.startsWith('/api');

  if (isApiRequest) {
    return res.status(statusCode).json({
      error: message,
      ...(isDev && { stack: err.stack })
    });
  }

  // Render EJS error page for browser requests
  return res.status(statusCode).render('error', {
    statusCode,
    message,
    stack: isDev ? err.stack : null
  });
}

function notFoundHandler(req, res) {
  const isApiRequest = req.originalUrl.startsWith('/api');

  if (isApiRequest) {
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  }

  return res.status(404).render('404', {
    url: req.originalUrl
  });
}

module.exports = { errorHandler, notFoundHandler };