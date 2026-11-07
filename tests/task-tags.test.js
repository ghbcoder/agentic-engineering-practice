process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { db } = require('../src/db/connection');
const { createSchema } = require('../src/db/schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  db.prepare("INSERT INTO tasks (id, title) VALUES (1, 'Tagged Task')").run();
  db.prepare("INSERT INTO tags (id, name) VALUES (1, 'urgent')").run();
});

describe('POST /tasks/:id/tags', () => {
  test('applies a tag to a task', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ task_id: 1, tag_id: 1 });

    const row = db.prepare('SELECT * FROM task_tags WHERE task_id = 1 AND tag_id = 1').get();
    expect(row).toBeDefined();
  });

  test('shows the applied tag on the task', async () => {
    await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    const res = await request(app).get('/tasks/1');
    expect(res.body.tags.map((t) => t.name)).toEqual(['urgent']);
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).post('/tasks/99999/tags').send({ tag_id: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('rejects a request with no tag_id', async () => {
    const res = await request(app).post('/tasks/1/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('tag_id is required');
  });

  test('returns 404 when the tag does not exist', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 99999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not found');
  });

  test('returns 409 when the tag is already applied to the task', async () => {
    await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tag already applied to this task');
  });
});

describe('DELETE /tasks/:id/tags/:tagId', () => {
  test('removes a tag from a task', async () => {
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });

    const row = db.prepare('SELECT * FROM task_tags WHERE task_id = 1 AND tag_id = 1').get();
    expect(row).toBeUndefined();
  });

  test('returns 404 when the tag is not applied to the task', async () => {
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not applied to this task');
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).delete('/tasks/99999/tags/1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not applied to this task');
  });
});
