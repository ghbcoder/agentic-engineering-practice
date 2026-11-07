// An error that carries an HTTP status code. errorHandler turns it into
// a `{ error: message }` response with that status.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = { HttpError };
