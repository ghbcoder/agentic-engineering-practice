const { db } = require('../connection');

function findAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function insertUser({ name, email }) {
  const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
  return result.lastInsertRowid;
}

function updateUser(id, { name, email }) {
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id);
}

// Returns the number of rows deleted (0 or 1)
function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes;
}

module.exports = { findAllUsers, findUserById, insertUser, updateUser, deleteUser };
