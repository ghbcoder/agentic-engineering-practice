# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context files

Read the matching file before doing these tasks:

- **Adding an API endpoint:** @.claude/context/api-conventions.md
- **Writing tests:** @.claude/context/testing-standards.md

## Project

Taskr API: a REST API for task management built with Node.js, Express 5, SQLite (`better-sqlite3`, synchronous) and Jest + supertest. All application code lives in `src/`.

## Folder structure

```
src/
  app.js          builds the app and mounts every router (tests import this)
  server.js       entry point: app.listen(PORT)
  config.js       PORT, API_KEY (defaults 3000 and dev-key)
  routes/         one named Express router per resource
  services/       validation and business rules; email.js is a stub that only logs
  db/
    connection.js the shared db connection (WAL, foreign_keys = ON)
    schema.js     createSchema(db)
    seed.js       sample data for npm run db:seed
    queries/      SQL only, one file per table/resource
  middleware/     auth.js, request-logger.js, error-handler.js
  utils/          validation.js, constants.js, http-error.js
tests/            <resource>.test.js, one per resource
```

Each request goes through the layers in one direction:

**route** (`src/routes/`) → **service** (`src/services/`) → **query** (`src/db/queries/`) → **database connection** (`src/db/connection.js`)

- **Routes** read the request, call one service function and send the response. They never import from `src/db/`.
- **Services** hold validation and business rules and call query functions. They never import `src/db/connection.js` or run SQL.
- **Queries** are the only code that runs SQL. Each one imports the shared `db` from `src/db/connection.js` and returns plain rows, ids or change counts.

Each resource has one file in each layer, all with the same name: `src/routes/tasks.js`, `src/services/tasks.js`, `src/db/queries/tasks.js`. A service may call other resources' query functions (for example, the tasks service checks that a project exists).

## Naming conventions

- **All files use lowercase kebab-case:** `task-tags.js`, `error-handler.js`, `request-logger.js`. Don't add camelCase, PascalCase or one-off names.
- Name resource files in lowercase plural, the same in every layer (`comments.js`).
- Name test files `<resource>.test.js` after the route file they cover: `src/routes/task-tags.js` → `tests/task-tags.test.js`. Jest only runs files that match `tests/*.test.js`.
- Routers are named exports called `<resource>Router` in camelCase (`taskTagsRouter`). Only file names use kebab-case.

## Rules

- **Client errors are `HttpError`s.** Services `throw new HttpError(status, message)` from `src/utils/http-error.js`. Routes pass every error to `next(err)`, and `errorHandler` sends `{ error: message }`. Don't build error responses by hand.
- **Put helpers where they belong.** Validators go in `src/utils/validation.js`, shared constants in `src/utils/constants.js`, and environment config in `src/config.js`. Don't add a general-purpose utils file.
- **The schema exists once**, in `src/db/schema.js`. The seed script and the tests both call `createSchema(db)`.

## Commands

```bash
npm install
npm run db:seed        # create schema + sample data in ./taskr.db (skips if users already exist)
npm run db:reset       # rm -f taskr.db && reseed (uses `rm`, so it needs a POSIX shell, not cmd.exe)
npm start              # node src/server.js: server on PORT (default 3000); GET /health to check
npm run dev            # node --watch src/server.js
npm test               # all Jest suites
npx jest tests/tasks.test.js            # single file
npx jest -t "filters by ?status=active" # single test by name
```

There is no linter or build step.

## How it works

- **Routing:** `src/app.js` mounts `/`, `/webhooks`, `/users`, `/projects`, `/tasks` and `/tags`. Comments and task tags are nested routers mounted at `/tasks/:id/comments` and `/tasks/:id/tags`, using `Router({ mergeParams: true })` to read the task id. They're mounted before `/tasks`.
- **Database:** `connection.js` picks the file from `NODE_ENV`: `test` gives `:memory:`, otherwise it uses `DB_PATH` or `taskr.db`.
- **Auth:** `middleware/auth.js` checks the `x-api-key` header against `API_KEY`. Only `DELETE /users/:id` and `DELETE /projects/:id` use it.
- **Errors:** `errorHandler` responds with `err.status || 500` and `{ error: err.message }`, and logs only 5xx errors.
- **Task rules:** valid statuses are `active | completed | archived` (`VALID_TASK_STATUSES`, also a CHECK constraint in the schema). `PUT /tasks/:id` sets `completed_at` when a task becomes `completed` and clears it when it moves to any other status. `GET /tasks` pages with `page`/`page_size` (default 20, max 100).
- **Duplicates:** duplicate user emails and tag names are detected by catching SQLite UNIQUE errors in the service and turning them into 409s.

## Known bugs

These were kept on purpose during the refactor, which didn't change behavior. Fix them only when a task asks, and add a test with each fix.

- Deleting a task with comments or tags, a user with tasks, or a project with tasks returns a raw `FOREIGN KEY constraint failed` 500. The schema has no `ON DELETE` rules.
- `POST /projects` with an `owner_id` that doesn't exist returns the same foreign-key 500.
- `PUT /users/:id` returns 500 instead of 409 for a duplicate email, and doesn't validate the email format.
- A `POST` or `PUT` with no JSON body returns a 500 with a JavaScript `TypeError` message instead of a 400.

## Tests

Tests are in `tests/`, one `<resource>.test.js` per resource. Each file sets `process.env.NODE_ENV = 'test'` **before** it requires `../src/app`, calls `createSchema(db)` in `beforeAll`, and clears every table in `beforeEach` (child tables first). See the testing standards file for the full setup.

## Git

Commit messages use the conventional commit format (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). `/commit-push` commits only what is already staged; it doesn't run `git add`.
