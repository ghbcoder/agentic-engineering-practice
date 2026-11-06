# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taskr API: a REST API for task management built with Node.js, Express 5, SQLite (`better-sqlite3`, synchronous) and Jest + supertest. It is a practice codebase for agentic engineering, so it has some messy structure on purpose: inconsistent layering, odd file names, dead files and TODOs. Don't "fix" this structure unless the task asks for it.

## Commands

```bash
npm install
npm run db:seed        # create schema + sample data in ./taskr.db (skips if users already exist)
npm run db:reset       # rm -f taskr.db && reseed (uses `rm`, so it needs a POSIX shell, not cmd.exe)
npm start              # server on PORT (default 3000); GET /health to check
npm run dev            # node --watch
npm test               # all Jest suites
npx jest tests/tasks.test.js            # single file
npx jest -t "filters by ?status=active" # single test by name
```

There is no linter or build step.

**Test file discovery:** Jest only runs files that match the `testMatch` list in `package.json`: `tests/*.test.js`, `tests/userTest.js` and `tests/test-projects.js`. A new test file that matches none of those patterns won't run. Name new test files `*.test.js`.

## Architecture

- `index.js` builds the Express app, mounts `routes.js`, and only calls `listen` when run directly (`require.main === module`). Tests import the app from here. A few routes (`/` and `POST /webhooks/task-update`) are defined in `index.js` instead of `routes.js`.
- `routes.js` is one big router for every resource: users, projects, tasks, comments, tags and task tags. Most handlers run SQL inline through `db.prepare(...)`, with validation inline too. The exceptions are:
  - Users go through `UserController.js`. It throws errors with an `err.status` property, and the routes map that to the HTTP status. `createUser` also calls the stub `sendEmail.js`.
  - Task list and detail reads go through `get-tasks.js`. `getTaskById` adds `tags` and `comments` to the task.
  - Project stats come from `projectHelpers.js`. `routes.js` requires it lazily inside the handler, because `projectHelpers.formatProjectSummary` requires `routes.js` back (a known circular dependency, through `getTasksForProject`, which `routes.js` exports).
- `DB.js` exports a single shared `db` connection with WAL mode and `foreign_keys = ON`. It picks the database file from `NODE_ENV`: `test` gives `:memory:`, otherwise it uses `DB_PATH` or `taskr.db`.
- `auth.js` checks the `x-api-key` header against `API_KEY` (default `dev-key`). Only `DELETE /users/:id` and `DELETE /projects/:id` require it.
- `misc/constants.js` holds `PORT`, the pagination limits and `VALID_TASK_STATUSES` (`active | completed | archived`, which is also a CHECK constraint in the schema). `misc/oldRoutes.js` and `misc/temp.js` are dead code that nothing imports.
- `PUT /tasks/:id` sets `completed_at` when a task's status changes to `completed` and clears it when the status changes to anything else.

## Schema is duplicated

The DDL lives in two places: `db/seed.js` (for the real database) and `tests/schema.js` (for the in-memory test database). If you change the schema, update both.

## Test conventions

Each test file sets `process.env.NODE_ENV = 'test'` **before** it requires `../index`, so that `DB.js` opens `:memory:`. It then calls `createSchema(db)` in `beforeAll` and runs `DELETE FROM` on every table in `beforeEach`, removing child tables first (`task_tags`, `comments`, `tasks`, `projects`, `users`, `tags`) so the foreign keys aren't violated. Follow the same pattern in new test files.

## Git

Commit messages use the conventional commit format (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). `/commit-push` commits only what is already staged; it doesn't run `git add`.
