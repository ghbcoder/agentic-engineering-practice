# API conventions: adding a new endpoint

How to add a new endpoint to the Taskr API. These conventions describe the layout **after the refactor**: route files live in `src/routes/`, business logic lives in `src/services/`, and the app is built in `src/index.js`.

## 1. Put the routes in a dedicated route file

- Each resource gets its own file in `src/routes/`. Don't add routes to the old top-level `routes.js`.
- Name the file after the resource, in lowercase plural: `src/routes/tasks.js`, `src/routes/comments.js`, `src/routes/tags.js`.
- The file exports a **named** Express router, not a default export.

```js
// src/routes/comments.js
const express = require('express');
const commentsService = require('../services/comments');

const commentsRouter = express.Router();

// handlers go here (see step 2)

module.exports = { commentsRouter };
```

## 2. Keep business logic out of route handlers

Each handler calls a matching function in `src/services/` and does nothing else beyond reading the request and sending the response. SQL, validation and other business rules belong in the service, not the handler.

```js
commentsRouter.get('/:id', (req, res, next) => {
  try {
    const comment = commentsService.getCommentById(req.params.id);
    if (!comment) return next({ status: 404, message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    next(err);
  }
});
```

Give the service file the same name as the route file (`src/services/comments.js`) and export one function per operation (`getCommentById`, `createComment`, ...).

## 3. Pass errors to `next`

Don't send error responses with `res.status(...).json(...)` in handlers. Pass errors to Express's `next` function as an object with a status code and a message:

```js
return next({ status: 400, message: 'body is required' });
```

Services that detect a client error should throw an error with the same `status` and `message` properties. The handler's `catch` passes it to `next`. The global error handler turns the error into an `{ error: message }` response with that status, or 500 if no status is set.

## 4. Register the router in `src/index.js`

Mount every router in `src/index.js` with `app.use`, giving the resource path and the imported router:

```js
const { commentsRouter } = require('./routes/comments');

app.use('/comments', commentsRouter);
```

Paths inside the router are relative to that mount path. In the example above, `commentsRouter.get('/:id')` serves `GET /comments/:id`.

## Checklist

- [ ] `src/routes/<resources>.js` exports a named router
- [ ] Handlers only call `src/services/<resources>.js` functions
- [ ] Errors go through `next({ status, message })`
- [ ] Router is mounted in `src/index.js` with `app.use('/<resources>', <resources>Router)`
- [ ] Tests are in `tests/<resource>.test.js` (see the test conventions in `CLAUDE.md`)
