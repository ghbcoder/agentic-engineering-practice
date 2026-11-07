const { db } = require('../connection');

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

module.exports = { findUserById };
