function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  // Client errors (4xx) are expected outcomes, so only log server errors
  if (status >= 500) {
    console.error(err.stack || err);
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
