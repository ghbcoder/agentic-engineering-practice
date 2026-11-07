const tasksQueries = require('../db/queries/tasks');
const { findProjectById } = require('../db/queries/projects');
const { findUserById } = require('../db/queries/users');
const { findCommentsByTaskId } = require('../db/queries/comments');
const { findTagsByTaskId } = require('../db/queries/task-tags');
const { HttpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');
const { VALID_TASK_STATUSES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../utils/constants');

function assertValidStatus(status) {
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }
}

function listTasks({ status, project_id, assignee_id, page, page_size }) {
  assertValidStatus(status);

  const limit = Math.min(MAX_PAGE_SIZE, parseInt(page_size) || DEFAULT_PAGE_SIZE);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  return tasksQueries.findTasks({
    status: status || undefined,
    projectId: project_id ? parseInt(project_id) : undefined,
    assigneeId: assignee_id ? parseInt(assignee_id) : undefined,
    limit,
    offset
  });
}

function createTask({ title, description, project_id, assignee_id, due_date }) {
  if (!title || !isNonEmptyString(title)) {
    throw new HttpError(400, 'title is required');
  }
  if (project_id && !findProjectById(parseInt(project_id))) {
    throw new HttpError(400, 'project not found');
  }
  if (assignee_id && !findUserById(parseInt(assignee_id))) {
    throw new HttpError(400, 'assignee not found');
  }

  const id = tasksQueries.insertTask({
    title,
    description: description || null,
    projectId: project_id ? parseInt(project_id) : null,
    assigneeId: assignee_id ? parseInt(assignee_id) : null,
    dueDate: due_date || null
  });
  return tasksQueries.findTaskById(id);
}

// Returns the task with its tags and comments, or null if it doesn't exist
function getTaskById(id) {
  const task = tasksQueries.findTaskById(id);
  if (!task) return null;
  task.tags = findTagsByTaskId(id);
  task.comments = findCommentsByTaskId(id);
  return task;
}

function updateTask(id, { title, description, status, project_id, assignee_id, due_date }) {
  const existing = tasksQueries.findTaskById(id);
  if (!existing) throw new HttpError(404, 'Task not found');

  assertValidStatus(status);

  const updatedStatus = status !== undefined ? status : existing.status;
  // Set completed_at when a task becomes completed, keep it while it stays
  // completed, and clear it when it moves to any other status
  const completedAt = updatedStatus === 'completed' && existing.status !== 'completed'
    ? new Date().toISOString()
    : (updatedStatus !== 'completed' ? null : existing.completed_at);

  tasksQueries.updateTask(id, {
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    status: updatedStatus,
    projectId: project_id !== undefined ? project_id : existing.project_id,
    assigneeId: assignee_id !== undefined ? assignee_id : existing.assignee_id,
    dueDate: due_date !== undefined ? due_date : existing.due_date,
    completedAt
  });
  return tasksQueries.findTaskById(id);
}

function deleteTask(id) {
  if (tasksQueries.deleteTask(id) === 0) {
    throw new HttpError(404, 'Task not found');
  }
  return { deleted: true };
}

module.exports = { listTasks, createTask, getTaskById, updateTask, deleteTask };
