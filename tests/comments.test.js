process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db/connection');
const { createSchema } = require('../src/db/schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Alice Chen', 'alice@test.com');
  db.prepare("INSERT INTO tasks (id, title) VALUES (1, 'Commented Task')").run();
});

describe('GET /tasks/:id/comments', () => {
  test('returns the comments on a task, oldest first, with the author name', async () => {
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'Second', '2026-01-02 10:00:00')").run();
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'First', '2026-01-01 10:00:00')").run();

    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].body).toBe('First');
    expect(res.body[1].body).toBe('Second');
    expect(res.body[0].user_name).toBe('Alice Chen');
  });

  test('returns an empty list when the task has no comments', async () => {
    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).get('/tasks/99999/comments');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });
});

describe('POST /tasks/:id/comments', () => {
  test('adds a comment to a task and returns it with the author name', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ user_id: 1, body: 'Looks good' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.task_id).toBe(1);
    expect(res.body.user_id).toBe(1);
    expect(res.body.body).toBe('Looks good');
    expect(res.body.user_name).toBe('Alice Chen');

    const count = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE task_id = 1').get().n;
    expect(count).toBe(1);
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app)
      .post('/tasks/99999/comments')
      .send({ user_id: 1, body: 'Hello' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('checks that the task exists before validating the body', async () => {
    const res = await request(app).post('/tasks/99999/comments').send({});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('rejects a comment with no body', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('body is required');
  });

  test('rejects a comment whose body is only whitespace', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 1, body: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('body is required');
  });

  test('rejects a comment with no user_id', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ body: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('user_id is required');
  });

  test('rejects a comment from a user that does not exist', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 99999, body: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('user not found');
  });
});
