process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
});

describe('GET /tags', () => {
  test('returns all tags sorted by name', async () => {
    db.prepare("INSERT INTO tags (name) VALUES ('urgent')").run();
    db.prepare("INSERT INTO tags (name) VALUES ('backend')").run();

    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.name)).toEqual(['backend', 'urgent']);
  });

  test('returns an empty list when there are no tags', async () => {
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /tags', () => {
  test('creates a tag, stored in lowercase without surrounding spaces', async () => {
    const res = await request(app).post('/tags').send({ name: '  Frontend ' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('frontend');

    const row = db.prepare('SELECT name FROM tags WHERE id = ?').get(res.body.id);
    expect(row.name).toBe('frontend');
  });

  test('rejects a tag with no name', async () => {
    const res = await request(app).post('/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  test('rejects a tag whose name is only whitespace', async () => {
    const res = await request(app).post('/tags').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  test('returns 409 when a tag with the same name already exists, ignoring case', async () => {
    db.prepare("INSERT INTO tags (name) VALUES ('bug')").run();
    const res = await request(app).post('/tags').send({ name: 'BUG' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tag already exists');
  });
});
