# Testing standards

How to write tests for the Taskr API.

## File naming

- Name each test file `<resource>.test.js`, in lowercase: `tasks.test.js`, `comments.test.js`, `tags.test.js`. Put it in `tests/`.
- Jest only finds files that match `testMatch` in `package.json`, which is `tests/*.test.js`. A file with any other name won't run.
- Use the same resource name as the route file: `src/routes/task-tags.js` is tested by `tests/task-tags.test.js`.

## Tools and database

- Use **Jest** as the test runner and **supertest** to send HTTP requests to the app. Don't start a server or call `listen`. Pass the app to `request(app)`.
- Tests run against an **in-memory SQLite database**, so they don't need an external database, a seed step or a `taskr.db` file. Setting `NODE_ENV=test` makes `src/db/connection.js` open `:memory:`.

Every test file starts with this setup:

```js
process.env.NODE_ENV = 'test'; // must come before requiring the app

const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db/connection');
const { createSchema } = require('../src/db/schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  // Child tables first, so foreign keys aren't violated
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  // Insert only the rows this file's tests need
});
```

Insert test data directly with `db.prepare(...).run(...)` in `beforeEach` or inside the test. Don't depend on data that another test created.

## Coverage: happy path plus at least two error cases

Every endpoint gets:

1. **A happy-path test.** A valid request succeeds. Check the status code and the response body, and for writes, check that the database changed.
2. **At least two error-case tests.** Typical ones:
   - the resource doesn't exist (`404`)
   - a required field is missing or invalid (`400`)
   - a value breaks a rule, such as a status not in `active | completed | archived` (`400`)
   - a protected endpoint gets a missing or wrong `x-api-key` (`401`)

For error cases, check the status code and that the body has an `error` message.

If an endpoint really has fewer than two ways to fail (for example, a list endpoint with no input), don't write a test that locks in accidental behavior. Say so in your summary instead.

## Test descriptions

Describe what the endpoint does, in plain English, from the API user's point of view. Don't describe implementation details.

| Good | Bad |
|---|---|
| `returns 404 when the task does not exist` | `getTaskById returns null` |
| `sets completed_at when a task is marked completed` | `runs UPDATE with completed_at = CURRENT_TIMESTAMP` |
| `rejects a comment with an empty body` | `isNonEmptyString check fails` |

Group tests with one `describe` block per endpoint, named after the method and path: `describe('POST /tasks/:id/comments', ...)`.

## Running

The whole suite must run with `npm test` and nothing else: no seed, no environment variables and no running server. A test that needs anything more is broken. Run a single file with `npx jest tests/<resource>.test.js`.
