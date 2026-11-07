const { db } = require('../connection');

function findAllTags() {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
}

function findTagById(id) {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

function insertTag(name) {
  return db.prepare('INSERT INTO tags (name) VALUES (?)').run(name).lastInsertRowid;
}

module.exports = { findAllTags, findTagById, insertTag };
