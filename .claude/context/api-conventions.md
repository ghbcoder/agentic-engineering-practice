# API conventions: adding a new endpoint

How to add a new endpoint to the Taskr API. Each resource has three layers, each in its own file with the same name:

| Layer | File | Holds |
|---|---|---|
| Route | `src/routes/<resources>.js` | Reads the request, calls the service, sends the response |
| Service | `src/services/<resources>.js` | Validation and business rules |
| Queries | `src/db/queries/<resources>.js` | SQL only |

Name the files after the resource, in lowercase plural kebab-case: `tasks.js`, `comments.js`, `task-tags.js`. If the resource already exists, add to its existing files.

## 1. Write the SQL in the queries file

Query functions run one statement each and return plain rows, ids or change counts. No validation and no HTTP errors.

```js
// src/db/queries/comments.js
const { db } = require('../connection');

function findCommentById(id) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

module.exports = { findCommentById };
```

## 2. Put the rules in the service

The service validates input, enforces business rules, and calls query functions. It may call other resources' query functions, such as `findTaskById`. For a client error, throw an `HttpError`:

```js
// src/services/comments.js
const commentsQueries = require('../db/queries/comments');
const { HttpError } = require('../utils/http-error');

function updateComment(id, { body }) {
  if (!commentsQueries.findCommentById(id)) throw new HttpError(404, 'Comment not found');
  // ...
}

module.exports = { updateComment };
```

Export one function per operation (`getCommentById`, `createComment`, ...). Services never import `src/db/connection.js`.

## 3. Keep route handlers thin

The route file exports a **named** Express router. Each handler reads the request, calls one service function and sends the result. Pass every error to `next`. Don't build error responses with `res.status(...).json(...)`:

```js
// src/routes/comments.js
const express = require('express');
const commentsService = require('../services/comments');

const commentsRouter = express.Router({ mergeParams: true });

commentsRouter.get('/:commentId', (req, res, next) => {
  try {
    const comment = commentsService.getCommentById(parseInt(req.params.commentId));
    if (!comment) return next({ status: 404, message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
```

The global `errorHandler` turns an error into an `{ error: message }` response with its `status`, or 500 if it has none. Add the `authenticate` middleware from `src/middleware/auth.js` to any endpoint that needs the API key.

## 4. Mount the router in `src/app.js`

```js
const { commentsRouter } = require('./routes/comments');

app.use('/tasks/:id/comments', commentsRouter);
```

Paths inside the router are relative to the mount path. A router mounted under a parameter (such as `/tasks/:id/...`) needs `express.Router({ mergeParams: true })` to read `req.params.id`, and must be mounted **before** `app.use('/tasks', tasksRouter)`.

## Checklist

- [ ] SQL only in `src/db/queries/<resources>.js`
- [ ] Validation and rules in `src/services/<resources>.js`, with client errors thrown as `HttpError`
- [ ] `src/routes/<resources>.js` exports a named router whose handlers only call the service and pass errors to `next`
- [ ] Router mounted in `src/app.js`
- [ ] All new file names are lowercase kebab-case
- [ ] Tests in `tests/<resource>.test.js` (see testing-standards.md)
