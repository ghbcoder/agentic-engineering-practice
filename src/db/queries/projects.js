const { db } = require('../connection');

function findAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

function findProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function insertProject({ name, description, ownerId }) {
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description, ownerId);
  return result.lastInsertRowid;
}

function updateProject(id, { name, description, ownerId }) {
  db.prepare(
    'UPDATE projects SET name = ?, description = ?, owner_id = ? WHERE id = ?'
  ).run(name, description, ownerId, id);
}

// Returns the number of rows deleted (0 or 1)
function deleteProject(id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes;
}

module.exports = { findAllProjects, findProjectById, insertProject, updateProject, deleteProject };
