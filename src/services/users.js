const usersQueries = require('../db/queries/users');
const { sendEmail } = require('./email');
const { HttpError } = require('../utils/http-error');
const { validateEmail, isNonEmptyString } = require('../utils/validation');

function listUsers() {
  return usersQueries.findAllUsers();
}

function getUserById(id) {
  return usersQueries.findUserById(id);
}

async function createUser({ name, email }) {
  if (!name || !isNonEmptyString(name)) {
    throw new HttpError(400, 'name is required');
  }
  if (!email || !isNonEmptyString(email)) {
    throw new HttpError(400, 'email is required');
  }
  if (!validateEmail(email)) {
    throw new HttpError(400, 'Invalid email address');
  }

  let id;
  try {
    id = usersQueries.insertUser({ name, email });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      throw new HttpError(409, 'email already exists');
    }
    throw err;
  }
  const user = usersQueries.findUserById(id);

  // TODO: move the welcome email to a notification service
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Taskr!',
    body: `Hi ${user.name}, your account is ready. Start managing your tasks at taskr.io.`
  });

  return user;
}

function updateUser(id, data) {
  const existing = usersQueries.findUserById(id);
  if (!existing) throw new HttpError(404, 'User not found');

  usersQueries.updateUser(id, {
    name: data.name !== undefined ? data.name : existing.name,
    email: data.email !== undefined ? data.email : existing.email
  });
  return usersQueries.findUserById(id);
}

function deleteUser(id) {
  if (usersQueries.deleteUser(id) === 0) {
    throw new HttpError(404, 'User not found');
  }
  return { deleted: true };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
