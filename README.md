# Taskr API

A REST API for a simple task management service. Users can create tasks, assign them to projects, mark them complete, add comments, and filter by status.

**Stack:** Node.js · Express · SQLite (via `better-sqlite3`) · Jest

---

## Setup

```bash
npm install
npm run db:seed
npm test
npm run dev
```

The server starts on port 3000. Visit `http://localhost:3000/health` to confirm it's running.

---

## Resources

| Resource | Base path |
|---|---|
| Users | `/users` |
| Projects | `/projects` |
| Tasks | `/tasks` |
| Comments | `/tasks/:id/comments` |
| Tags | `/tags` |
| Task tags | `/tasks/:id/tags` |

`DELETE /users/:id` and `DELETE /projects/:id` require an `x-api-key` header (`API_KEY`, default `dev-key`).

---

## Project structure

```
src/
  app.js        Express app and router mounting
  server.js     entry point
  config.js     PORT and API_KEY from the environment
  routes/       one router per resource
  services/     validation and business rules
  db/           connection, schema, seed and SQL queries (db/queries/)
  middleware/   auth, request logging, error handling
  utils/        validators, constants, HttpError
tests/          one <resource>.test.js per resource
```

Requests flow through **routes → services → queries**: routes handle HTTP, services hold the rules, and only `src/db/queries/` runs SQL.

---

## npm scripts

| Script | What it does |
|---|---|
| `npm start` | Start the server |
| `npm run dev` | Start with file watching (Node 18+) |
| `npm test` | Run the test suite |
| `npm run db:seed` | Create schema and seed sample data |
| `npm run db:reset` | Drop and re-seed the database |

---

## Database

SQLite — no external database required. The database file (`taskr.db`) is created locally when you run `npm run db:seed`. Sample data includes 5 users, 3 projects, 20 tasks, 15 comments, and 8 tags.

---

## Testing

Tests use Jest and supertest. The test suite runs against an in-memory database — no setup required beyond `npm install`.

```bash
npm test
npm run test:watch
```
