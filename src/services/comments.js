const commentsQueries = require('../db/queries/comments');
const { findTaskById } = require('../db/queries/tasks');
const { findUserById } = require('../db/queries/users');
const { HttpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function assertTaskExists(taskId) {
  if (!findTaskById(taskId)) throw new HttpError(404, 'Task not found');
}

function listCommentsForTask(taskId) {
  assertTaskExists(taskId);
  return commentsQueries.findCommentsByTaskId(taskId);
}

function createComment(taskId, { user_id, body }) {
  assertTaskExists(taskId);

  if (!body || !isNonEmptyString(body)) {
    throw new HttpError(400, 'body is required');
  }
  if (!user_id) {
    throw new HttpError(400, 'user_id is required');
  }
  if (!findUserById(parseInt(user_id))) {
    throw new HttpError(400, 'user not found');
  }

  const id = commentsQueries.insertComment({ taskId, userId: parseInt(user_id), body });
  return commentsQueries.findCommentById(id);
}

module.exports = { listCommentsForTask, createComment };
